<?php

namespace App\Exceptions;

use RuntimeException;

class VehicleNotRegisteredException extends RuntimeException
{
    public function __construct(
        public readonly string $normalizedPlate
    ) {
        parent::__construct('Kendaraan dengan plat nomor tersebut tidak terdaftar.');
    }
}
