<?php

namespace Tests\Feature;

use App\Models\RfidCard;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccountRfidSwitchTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_switch_rfid_to_existing_card_and_reassign_it(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
            'status' => 'active',
        ]);
        /** @var User $admin */

        $targetUser = User::factory()->create([
            'role' => 'user',
            'is_active' => true,
            'status' => 'active',
        ]);

        $previousCard = RfidCard::create([
            'user_id' => $targetUser->id,
            'uid' => 'OLD-001',
            'is_active' => true,
        ]);

        $otherUser = User::factory()->create([
            'role' => 'user',
            'is_active' => true,
            'status' => 'active',
        ]);

        $switchCard = RfidCard::create([
            'user_id' => $otherUser->id,
            'uid' => 'NEW-999',
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->put(route('admin.accounts.update-identity', $targetUser), [
                'rfid_uid' => 'new-999',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertDatabaseHas('rfid_cards', [
            'id' => $previousCard->id,
            'user_id' => $targetUser->id,
            'uid' => 'OLD-001',
            'is_active' => false,
        ]);

        $this->assertDatabaseHas('rfid_cards', [
            'id' => $switchCard->id,
            'user_id' => $targetUser->id,
            'uid' => 'NEW-999',
            'is_active' => true,
        ]);

        $this->assertDatabaseMissing('rfid_cards', [
            'id' => $switchCard->id,
            'user_id' => $otherUser->id,
        ]);
    }
}