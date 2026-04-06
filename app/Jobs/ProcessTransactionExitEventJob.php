<?php

namespace App\Jobs;

use App\Models\ProcessedEvent;
use App\Models\TransactionExitEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessTransactionExitEventJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public const CONSUMER_NAME = 'transaction-exit-consumer';

    public int $tries = 1;

    public function __construct(public int $eventId)
    {
    }

    public function handle(): void
    {
        try {
            $event = TransactionExitEvent::query()
                ->with(['transaction' => fn ($query) => $query->withTrashed()])
                ->find($this->eventId);

            if (!$event) {
                Log::warning('transaction_exit_event_missing', [
                    'event_id' => $this->eventId,
                ]);

                return;
            }

            $result = DB::transaction(function () use ($event): array {
                $existing = ProcessedEvent::query()
                    ->where('event_uuid', $event->event_uuid)
                    ->where('consumer_name', self::CONSUMER_NAME)
                    ->first();

                if ($existing) {
                    return $this->persistResult($event, 'skipped', 'duplicate_event', 'Event already processed for consumer.');
                }

                $lastSequence = ProcessedEvent::query()
                    ->where('consumer_name', self::CONSUMER_NAME)
                    ->where('sequence_scope_type', $event->sequence_scope_type)
                    ->where('sequence_scope_key', $event->sequence_scope_key)
                    ->where('status', 'success')
                    ->max('sequence_number');

                $sequenceAnomaly = null;
                if ($event->sequence_number !== null) {
                    if ($lastSequence !== null && (int) $event->sequence_number <= (int) $lastSequence) {
                        return $this->persistResult(
                            $event,
                            'skipped',
                            'duplicate_or_outdated_sequence',
                            'Sequence is not newer than the last processed event.'
                        );
                    }

                    if ($lastSequence !== null && (int) $event->sequence_number > ((int) $lastSequence + 1)) {
                        $sequenceAnomaly = 'sequence_gap';
                    }

                    if ($lastSequence === null && (int) $event->sequence_number > 1) {
                        $sequenceAnomaly = 'sequence_gap';
                    }
                }

                $transaction = $event->transaction;
                if (!$transaction) {
                    return $this->persistResult($event, 'failed', 'missing_transaction', 'Linked transaction not found.');
                }

                if ($transaction->status !== 'completed') {
                    return $this->persistResult($event, 'skipped', 'state_conflict', 'Transaction is not in completed state.');
                }

                if ($event->parking_session_id && $transaction->parking_session_id && $event->parking_session_id !== $transaction->parking_session_id) {
                    return $this->persistResult($event, 'skipped', 'parking_session_conflict', 'Parking session does not match the linked transaction.');
                }

                return $this->persistResult(
                    $event,
                    'success',
                    $sequenceAnomaly,
                    $sequenceAnomaly ? 'Sequence gap detected but state was valid.' : 'Processed successfully.'
                );
            });

            $logContext = [
                'event_uuid' => $event->event_uuid,
                'event_id' => $event->id,
                'sequence_scope_type' => $event->sequence_scope_type,
                'sequence_scope_key' => $event->sequence_scope_key,
                'sequence_number' => $event->sequence_number,
                'parking_session_id' => $event->parking_session_id,
                'transaction_id' => $event->transaction_id,
                'consumer_name' => self::CONSUMER_NAME,
            ];

            if ($result['status'] === 'success') {
                Log::info('transaction_exit_event_processed', $logContext + [
                    'message' => $result['message'],
                    'anomaly_type' => $result['anomaly_type'],
                ]);
                $this->maybeRaiseAlert();
                return;
            }

            if ($result['status'] === 'skipped') {
                Log::warning('transaction_exit_event_skipped', $logContext + [
                    'message' => $result['message'],
                    'anomaly_type' => $result['anomaly_type'],
                ]);
                $this->maybeRaiseAlert();
                return;
            }

            Log::error('transaction_exit_event_failed', $logContext + [
                'message' => $result['message'],
                'anomaly_type' => $result['anomaly_type'],
            ]);
            $this->maybeRaiseAlert();
        } catch (\Throwable $throwable) {
            Log::error('transaction_exit_event_consumer_exception', [
                'event_id' => $this->eventId,
                'message' => $throwable->getMessage(),
            ]);
        }
    }

    private function persistResult(TransactionExitEvent $event, string $status, ?string $anomalyType, string $message): array
    {
        ProcessedEvent::create([
            'event_uuid' => $event->event_uuid,
            'consumer_name' => self::CONSUMER_NAME,
            'sequence_scope_type' => $event->sequence_scope_type,
            'sequence_scope_key' => $event->sequence_scope_key,
            'sequence_number' => $event->sequence_number,
            'parking_session_id' => $event->parking_session_id,
            'status' => $status,
            'anomaly_type' => $anomalyType,
            'message' => $message,
            'processed_at' => now(),
            'payload' => $event->payload,
        ]);

        return [
            'status' => $status,
            'anomaly_type' => $anomalyType,
            'message' => $message,
        ];
    }

    private function maybeRaiseAlert(): void
    {
        $recentIssues = ProcessedEvent::query()
            ->where('consumer_name', self::CONSUMER_NAME)
            ->where('created_at', '>=', now()->subMinutes(30))
            ->whereIn('status', ['failed', 'skipped'])
            ->count();

        if ($recentIssues >= 5) {
            Log::critical('transaction_exit_event_alert_threshold_reached', [
                'consumer_name' => self::CONSUMER_NAME,
                'recent_issue_count' => $recentIssues,
            ]);
        }
    }
}
