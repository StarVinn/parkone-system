<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;

class CustomizationService
{
    public const LOCALES = ['id', 'en'];

    private function baseDir(): string
    {
        return storage_path('app/customization');
    }

    private function i18nPath(string $locale): string
    {
        $locale = strtolower(trim($locale));
        if (! in_array($locale, self::LOCALES, true)) {
            throw new RuntimeException('Unsupported locale.');
        }

        return $this->baseDir().DIRECTORY_SEPARATOR.'i18n'.DIRECTORY_SEPARATOR.$locale.'.json';
    }

    private function navbarPath(): string
    {
        return $this->baseDir().DIRECTORY_SEPARATOR.'navbar.json';
    }

    public function ensureDefaults(): void
    {
        File::ensureDirectoryExists($this->baseDir().DIRECTORY_SEPARATOR.'i18n');

        foreach (self::LOCALES as $locale) {
            $path = $this->i18nPath($locale);
            $defaults = $this->defaultTranslations($locale);

            if (! File::exists($path)) {
                File::put($path, json_encode($defaults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n");
                continue;
            }

            $decoded = json_decode((string) File::get($path), true);
            $existing = is_array($decoded) ? $decoded : [];

            $merged = array_merge($defaults, $existing);
            $merged = $this->normalizeStringMap($merged);

            File::put($path, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n");
        }

        $navbarPath = $this->navbarPath();
        if (! File::exists($navbarPath)) {
            File::put($navbarPath, json_encode($this->defaultNavbar(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n");
        }
    }

    public function getTranslations(string $locale): array
    {
        $this->ensureDefaults();

        $raw = File::get($this->i18nPath($locale));
        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return [];
        }

        return $decoded;
    }

    public function saveTranslations(string $locale, array $translations): void
    {
        $this->ensureDefaults();

        $normalized = $this->normalizeStringMap($translations);
        File::put($this->i18nPath($locale), json_encode($normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n");
    }

    public function getNavbar(): array
    {
        $this->ensureDefaults();

        $raw = File::get($this->navbarPath());
        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return $this->defaultNavbar();
        }

        return $decoded;
    }

    public function saveNavbar(array $navbar): void
    {
        $this->ensureDefaults();
        File::put($this->navbarPath(), json_encode($navbar, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n");
    }

    private function normalizeStringMap(array $value): array
    {
        $out = [];

        foreach ($value as $key => $val) {
            $key = trim((string) $key);
            if ($key === '') {
                continue;
            }

            if (is_array($val)) {
                $val = '';
            }

            $out[$key] = (string) $val;
        }

        ksort($out);

        return $out;
    }

    private function defaultTranslations(string $locale): array
    {
        if ($locale === 'en') {
            return [
                'actions.add' => 'Add',
                'actions.back_to_overview' => 'Back to Overview',
                'actions.cancel' => 'Cancel',
                'actions.close' => 'Close',
                'actions.delete' => 'Delete',
                'actions.edit' => 'Edit',
                'actions.view_data' => 'View Data',
                'actions.open_maps' => 'Open Maps',
                'actions.save' => 'Save',
                'actions.save_id' => 'Save ID',
                'actions.save_en' => 'Save EN',
                'actions.toggle' => 'Toggle',
                'actions.logout' => 'Logout',
                'fields.action' => 'Action',
                'fields.description' => 'Description',
                'fields.location' => 'Location',
                'fields.capacity' => 'Capacity',
                'fields.occupied' => 'Occupied',
                'fields.name' => 'Name',
                'fields.email' => 'Email',
                'fields.role' => 'Role',
                'fields.rfid' => 'RFID',
                'fields.rfid_uid' => 'RFID UID',
                'fields.status' => 'Status',
                'fields.license_plate' => 'License Plate',
                'fields.vehicle_type' => 'Vehicle Type',
                'fields.parking_location' => 'Parking Location',
                'fields.rate_type' => 'Rate Type',
                'fields.amount' => 'Amount',
                'states.saving' => 'Saving...',
                'states.processing' => 'Processing...',
                'filters.auto_apply' => 'Filters apply automatically after you stop typing.',
                'pagination.showing' => 'Showing {from} - {to} of {total}',
                'pagination.prev' => 'Prev',
                'pagination.next' => 'Next',
                'statuses.all' => 'All Status',
                'statuses.active' => 'Active',
                'statuses.pending' => 'Pending',
                'statuses.inactive' => 'Inactive',
                'statuses.pending_activation' => 'Pending Activation',
                'roles.officer' => 'Officer',
                'roles.owner' => 'Owner',
                'roles.admin' => 'Admin',
                'roles.user' => 'User',
                'rate_types.hourly' => 'Hourly',
                'rate_types.flat' => 'Flat',
                'fields.user' => 'User',
                'fields.activity' => 'Activity',
                'fields.time' => 'Time',
                'nav.dashboard' => 'Dashboard',
                'nav.vehicle' => 'Vehicle',
                'nav.vehicle.overview' => 'Overview',
                'nav.vehicle.types' => 'Manage Vehicle Types',
                'nav.vehicle.vehicles' => 'Manage Vehicles',
                'nav.parking' => 'Parking',
                'nav.parking.overview' => 'Overview',
                'nav.parking.locations' => 'Parking Locations',
                'nav.parking.areas' => 'Parking Areas',
                'nav.parking.rates' => 'Parking Rates',
                'nav.activity_logs' => 'Activity Logs',
                'nav.accounts' => 'Manage Accounts',
                'nav.customization' => 'Customization',
                'lang.id' => 'Bahasa Indonesia',
                'lang.en' => 'English',
                'layout.login_with_email' => 'Logged in with email',
                'layout.dark_mode' => '🌙 Dark Mode',
                'layout.light_mode' => '☀️ Light Mode',
                'layout.language' => 'Language',
                'customization.title' => 'Customization',
                'customization.description' => 'Manage translations and navbar labels.',
                'customization.tab.translations' => 'Translations',
                'customization.tab.navbar' => 'Navbar',
                'customization.translations.title' => 'Translations',
                'customization.translations.help' => 'Edit directly (no JSON). Add a row for a new key.',
                'customization.translations.key' => 'Key',
                'customization.translations.id' => 'ID',
                'customization.translations.en' => 'EN',
                'customization.translations.key_placeholder' => 'e.g. nav.dashboard',
                'customization.translations.id_placeholder' => 'Dashboard / Vehicle / ...',
                'customization.translations.en_placeholder' => 'Dashboard / Vehicle / ...',
                'customization.translations.search_placeholder' => 'Search key / ID / EN...',
                'customization.translations.remove_row' => 'Remove row',
                'customization.navbar.title' => 'Navbar',
                'customization.navbar.help' => 'Drag to reorder. Click the 3-dots to activate/deactivate.',
                'customization.navbar.preview_title' => 'Sidebar preview (editable)',
                'customization.navbar.inactive' => 'inactive',
                'customization.navbar.label_key' => 'Label Key / URL',
                'customization.navbar.group' => 'Group',
                'customization.navbar.link' => 'Link',
                'customization.navbar.label_key_placeholder' => 'e.g. nav.vehicle',
                'customization.navbar.href_placeholder' => '/admin/vehicles',
                'customization.navbar.activate' => 'Activate',
                'customization.navbar.deactivate' => 'Deactivate',
                'admin.vehicle_types.title' => 'Vehicle Types',
                'admin.vehicle_types.description' => 'Manage vehicle type categories for your parking system.',
                'admin.vehicle_types.add' => 'Add Type',
                'admin.vehicle_types.empty' => 'No vehicle types yet...',
                'admin.vehicle_types.confirm_delete' => 'Are you sure you want to delete this vehicle type?',
                'admin.vehicle_types.create_title' => 'Create Vehicle Type',
                'admin.vehicle_types.edit_title' => 'Edit Vehicle Type',
                'admin.vehicle_types.update' => 'Update Data',
                'admin.vehicle_types.fields.name' => 'Vehicle Type Name',
                'admin.vehicle_types.fields.name_placeholder' => 'Example: Sedan, Sport Bike...',
                'admin.vehicle_types.fields.description' => 'Description',
                'admin.vehicle_types.fields.description_placeholder' => 'Write a short description for this type...',
                'admin.vehicles.title' => 'Vehicles',
                'admin.vehicles.description' => 'Manage vehicles and vehicle types.',
                'admin.vehicles.add' => 'Add Vehicle',
                'admin.vehicles.search_placeholder' => 'Search plate or vehicle type...',
                'admin.vehicles.confirm_delete' => 'Are you sure you want to delete this vehicle?',
                'admin.vehicles.update' => 'Update Data',
                'admin.vehicles.filters.all_types' => 'All Types',
                'admin.vehicles.empty' => 'No matching vehicles found.',
                'admin.vehicles.modal.edit_title' => 'Edit Vehicle',
                'admin.vehicles.modal.create_title' => 'Create Vehicles',
                'admin.vehicles.fields.license_plate_placeholder' => 'Example: B 1234 CD',
                'admin.vehicles.fields.vehicle_type_placeholder' => 'Select vehicle type',
                'admin.vehicles.batch.row_title' => 'Vehicle #{n}',
                'admin.vehicles.batch.add_row' => 'Add Row',
                'admin.vehicles.batch.save_all' => 'Save All',
                'admin.parking_rates.title' => 'Parking Rates',
                'admin.parking_rates.description' => 'Manage parking rates by vehicle type and parking area.',
                'admin.parking_rates.add' => 'Add Rate',
                'admin.parking_rates.empty' => 'No parking rates yet...',
                'admin.parking_rates.update' => 'Update Data',
                'admin.parking_rates.confirm_delete' => 'Are you sure you want to delete this parking rate?',
                'admin.parking_rates.per_hour_suffix' => '/ hour',
                'admin.parking_rates.modal.edit_title' => 'Edit Parking Rate',
                'admin.parking_rates.modal.create_title' => 'Create Parking Rate',
                'admin.parking_rates.fields.vehicle_type_placeholder' => 'Select vehicle type',
                'admin.parking_rates.fields.location_placeholder' => 'Select parking location',
                'admin.parking_rates.fields.rate_per_hour' => 'Rate Per Hour',
                'admin.parking_rates.fields.flat_rate' => 'Flat Rate',
                'admin.parking_rates.fields.rate_per_hour_placeholder' => 'Example: Rp 5.000',
                'admin.parking_rates.fields.flat_rate_placeholder' => 'Example: Rp 20.000',
                'admin.accounts.title' => 'Manage Accounts',
                'admin.accounts.description' => 'Manage users, roles, and RFID identities.',
                'admin.accounts.create' => 'Create Account',
                'admin.accounts.search_placeholder' => 'Search name, email, role, or RFID...',
                'admin.accounts.empty' => 'No matching accounts found.',
                'admin.accounts.actions.activate' => 'Activate Account',
                'admin.accounts.actions.close_action_menu' => 'Close action menu',
                'admin.accounts.actions.insert_rfid' => 'Insert RFID',
                'admin.accounts.actions.switch_rfid' => 'Switch RFID',
                'admin.accounts.actions.reset_email' => 'Reset Email',
                'admin.accounts.actions.deactivate' => 'Deactivate Account',
                'admin.accounts.actions.delete_user' => 'Delete User',
                'admin.accounts.confirm.title' => 'Confirmation',
                'admin.accounts.confirm.generic_desc' => 'Continue this action?',
                'admin.accounts.confirm.primary' => 'Confirm',
                'admin.accounts.confirm.delete_title' => 'Delete Account',
                'admin.accounts.confirm.delete_desc' => 'Are you sure you want to delete this user{name}? This action cannot be undone.',
                'admin.accounts.confirm.deactivate_title' => 'Deactivate Account',
                'admin.accounts.confirm.deactivate_desc' => 'Deactivate this account{name}? The user cannot log in until reactivated.',
                'admin.accounts.confirm.deactivate_btn' => 'Deactivate',
                'admin.accounts.rfid.title_insert' => 'Insert RFID',
                'admin.accounts.rfid.title_switch' => 'Switch RFID',
                'admin.accounts.rfid.current' => 'Current RFID',
                'admin.accounts.rfid.placeholder' => 'Scan / input RFID UID',
                'admin.accounts.rfid.help' => 'Make sure the RFID input device is properly installed and secure before saving the UID.',
                'admin.accounts.rfid.btn_save' => 'Save RFID',
                'admin.accounts.rfid.btn_switch' => 'Switch RFID',
                'admin.accounts.email.title' => 'Reset Email',
                'admin.accounts.email.new_email' => 'New Email',
                'admin.accounts.email.help' => 'After the email is changed, the system will send an activation link to set the initial password again.',
                'admin.accounts.email.btn_save' => 'Save Email',
                'admin.accounts.create_modal.title' => 'Create Account',
                'admin.accounts.create_modal.name_placeholder' => 'Full name',
                'admin.accounts.create_modal.rfid_optional' => 'RFID UID (Optional)',
                'admin.accounts.create_modal.help' => "After the account is created, the system will send an activation link to the user's email to set the initial password.",
                'admin.accounts.create_modal.btn_create' => 'Create Account',
                'admin.dashboard.title' => 'Admin Dashboard',
                'admin.dashboard.description' => 'System readiness summary and master data health.',
                'admin.dashboard.setup.rate_coverage' => 'Rate Coverage',
                'admin.dashboard.setup.rate_coverage_subtitle' => 'Configured vs expected combinations',
                'admin.dashboard.setup.area_incomplete_rate' => 'Areas Missing Complete Rates',
                'admin.dashboard.setup.area_incomplete_rate_subtitle' => 'Complete rates per location',
                'admin.dashboard.setup.officer_active' => 'Active Officers',
                'admin.dashboard.setup.officer_active_subtitle' => 'Total officers',
                'admin.dashboard.setup.data_alert' => 'Data Alerts',
                'admin.dashboard.setup.data_alert_subtitle' => 'Check duplicates/invalid area',
                'admin.dashboard.master.location_total' => 'Parking Locations',
                'admin.dashboard.master.location_total_subtitle' => 'Total active locations',
                'admin.dashboard.master.area_total' => 'Parking Areas',
                'admin.dashboard.master.area_total_subtitle' => 'Total registered areas',
                'admin.dashboard.master.vehicle_type_total' => 'Vehicle Types',
                'admin.dashboard.master.vehicle_type_total_subtitle' => 'Active vehicle types',
                'admin.dashboard.master.rate_completeness' => 'Rate Completeness',
                'admin.dashboard.master.rate_completeness_subtitle' => 'Rate completeness across locations',
                'admin.dashboard.chart.vehicle' => 'Vehicle',
                'admin.dashboard.chart.parking' => 'Parking',
                'admin.dashboard.chart.total_data' => 'Total Data',
                'admin.activity_logs.title' => 'Activity Logs',
                'admin.activity_logs.description' => 'User activity history in the system.',
                'admin.activity_logs.search_placeholder' => 'Search activity, user name, or email...',
                'admin.activity_logs.empty' => 'No activity logs match the filter.',
                'admin.activity_logs.confirm_delete' => 'Are you sure you want to delete this activity log?',
                'admin.category.parking.title' => 'Parking Category',
                'admin.category.parking.description' => 'Overview page for all parking modules.',
                'admin.category.parking.locations_title' => 'Parking Locations',
                'admin.category.parking.locations_desc' => 'Manage main parking locations.',
                'admin.category.parking.areas_title' => 'Parking Areas',
                'admin.category.parking.areas_desc' => 'Manage parking areas/slots.',
                'admin.category.parking.rates_title' => 'Parking Rates',
                'admin.category.parking.rates_desc' => 'Manage parking rates.',
                'admin.category.parking.prereq_title' => 'Data Prerequisites',
                'admin.category.parking.prereq_1' => 'Add Parking Location first.',
                'admin.category.parking.prereq_2' => 'Add Parking Area after locations exist.',
                'admin.category.parking.prereq_3' => 'Add Parking Rate after vehicle type + location exist.',
                'admin.category.vehicle.title' => 'Vehicle Category',
                'admin.category.vehicle.description' => 'Overview page for all vehicle modules.',
                'admin.category.vehicle.vehicles_title' => 'Vehicles',
                'admin.category.vehicle.vehicles_desc' => 'Manage user vehicles data.',
                'admin.category.vehicle.types_title' => 'Vehicle Types',
                'admin.category.vehicle.types_desc' => 'Manage vehicle categories/types.',
                'admin.category.vehicle.prereq_title' => 'Data Prerequisites',
                'admin.category.vehicle.prereq_1' => 'Add Vehicle Type first.',
                // 'admin.category.vehicle.prereq_2' => 'Add Vehicle after type and active owners exist.',
                'admin.parking_locations.title' => 'Parking Locations',
                'admin.parking_locations.description' => 'Manage parking locations for your parking system.',
                'admin.parking_locations.add' => 'Add Location',
                'admin.parking_locations.empty' => 'No parking locations yet...',
                'admin.parking_locations.confirm_delete' => 'Are you sure you want to delete this parking location?',
                'admin.parking_locations.coords_unavailable' => 'Coordinates are not available yet',
                'admin.parking_locations.create_title' => 'Create Parking Location',
                'admin.parking_locations.edit_title' => 'Edit Parking Location',
                'admin.parking_locations.update' => 'Update Data',
                'admin.parking_locations.fields.name' => 'Location Name',
                'admin.parking_locations.fields.name_placeholder' => 'Example: Mall A Floor 2',
                'admin.parking_locations.fields.from_map' => 'Auto from map.',
                'admin.parking_locations.fields.description_placeholder' => 'Write a short description for this location...',
                'admin.parking_areas.title' => 'Parking Areas',
                'admin.parking_areas.description' => 'Manage parking areas for your parking system.',
                'admin.parking_areas.add' => 'Add Area',
                'admin.parking_areas.empty' => 'No parking areas yet...',
                'admin.parking_areas.confirm_delete' => 'Are you sure you want to delete this parking area?',
                'admin.parking_areas.ticket_penalty' => 'Ticket Penalty',
                'admin.parking_areas.create_title' => 'Create Parking Area',
                'admin.parking_areas.edit_title' => 'Edit Parking Area',
                'admin.parking_areas.update' => 'Update Data',
                'admin.parking_areas.fields.name' => 'Area Name',
                'admin.parking_areas.fields.name_placeholder' => 'Example: Basement A, Floor 3 Zone B',
                'admin.parking_areas.fields.location_placeholder' => 'Select parking location',
                'admin.parking_areas.fields.capacity_placeholder' => 'Example: 120',
                'admin.parking_areas.fields.ticket_penalty' => 'Ticket Penalty (Rp)',
                'admin.parking_areas.fields.ticket_penalty_placeholder' => 'Example: Rp 10.000',
            ];
        }

        return [
            'actions.add' => 'Tambah',
            'actions.back_to_overview' => 'Kembali ke Ringkasan',
            'actions.cancel' => 'Batal',
            'actions.close' => 'Tutup',
            'actions.delete' => 'Hapus',
            'actions.edit' => 'Edit',
            'actions.view_data' => 'Lihat Data',
            'actions.open_maps' => 'Buka Maps',
            'actions.save' => 'Simpan',
            'actions.save_id' => 'Simpan ID',
            'actions.save_en' => 'Simpan EN',
            'actions.toggle' => 'Ganti',
            'actions.logout' => 'Keluar',
            'fields.action' => 'Aksi',
            'fields.description' => 'Deskripsi',
            'fields.location' => 'Lokasi',
            'fields.capacity' => 'Kapasitas',
            'fields.occupied' => 'Terisi',
            'fields.name' => 'Nama',
            'fields.email' => 'Email',
            'fields.role' => 'Role',
            'fields.rfid' => 'RFID',
            'fields.rfid_uid' => 'RFID UID',
            'fields.status' => 'Status',
            'fields.license_plate' => 'Plat Nomor',
            'fields.vehicle_type' => 'Kategori Kendaraan',
            'fields.parking_location' => 'Lokasi Parkir',
            'fields.rate_type' => 'Tipe Tarif',
            'fields.amount' => 'Nominal',
            'states.saving' => 'Menyimpan...',
            'states.processing' => 'Memproses...',
            'filters.auto_apply' => 'Filter dijalankan otomatis setelah selesai mengetik.',
            'pagination.showing' => 'Menampilkan {from} - {to} dari {total} data',
            'pagination.prev' => 'Sebelumnya',
            'pagination.next' => 'Berikutnya',
            'fields.user' => 'User',
            'fields.activity' => 'Aktivitas',
            'fields.time' => 'Waktu',
            'statuses.all' => 'Semua Status',
            'statuses.active' => 'Aktif',
            'statuses.pending' => 'Pending',
            'statuses.inactive' => 'Nonaktif',
            'statuses.pending_activation' => 'Menunggu Aktivasi',
            'roles.officer' => 'Officer',
            'roles.owner' => 'Owner',
            'roles.admin' => 'Admin',
            'roles.user' => 'User',
            'rate_types.hourly' => 'Per Jam',
            'rate_types.flat' => 'Tetap',
            'nav.dashboard' => 'Beranda',
            'nav.vehicle' => 'Kendaraan',
            'nav.vehicle.overview' => 'Ringkasan',
            'nav.vehicle.types' => 'Kelola Kategori Kendaraan',
            'nav.vehicle.vehicles' => 'Kelola Kendaraan',
            'nav.parking' => 'Parkir',
            'nav.parking.overview' => 'Ringkasan',
            'nav.parking.locations' => 'Lokasi Parkir',
            'nav.parking.areas' => 'Area Parkir',
            'nav.parking.rates' => 'Tarif Parkir',
            'nav.activity_logs' => 'Log Aktivitas',
            'nav.accounts' => 'Kelola Akun',
            'nav.customization' => 'Kustomisasi',
            'lang.id' => 'Bahasa Indonesia',
            'lang.en' => 'English',
            'layout.login_with_email' => 'Login dengan email',
            'layout.dark_mode' => '🌙 Mode Gelap',
            'layout.light_mode' => '☀️ Mode Terang',
            'layout.language' => 'Bahasa',
            'customization.title' => 'Kustomisasi',
            'customization.description' => 'Atur terjemahan dan label navbar.',
            'customization.tab.translations' => 'Terjemahan',
            'customization.tab.navbar' => 'Navbar',
            'customization.translations.title' => 'Terjemahan',
            'customization.translations.help' => 'Edit langsung.',
            'customization.translations.key' => 'Key',
            'customization.translations.id' => 'ID',
            'customization.translations.en' => 'EN',
            'customization.translations.key_placeholder' => 'contoh: nav.dashboard',
            'customization.translations.id_placeholder' => 'Beranda / Kendaraan / ...',
            'customization.translations.en_placeholder' => 'Dashboard / Vehicle / ...',
            'customization.translations.search_placeholder' => 'Cari key / ID / EN...',
            'customization.translations.remove_row' => 'Hapus baris',
            'customization.navbar.title' => 'Navbar',
            'customization.navbar.help' => 'Drag untuk mengurutkan. Klik titik-3 untuk aktif/nonaktif.',
            'customization.navbar.preview_title' => 'Preview Sidebar (editable)',
            'customization.navbar.inactive' => 'inactive',
            'customization.navbar.label_key' => 'Label Key / URL',
            'customization.navbar.group' => 'Group',
            'customization.navbar.link' => 'Link',
            'customization.navbar.label_key_placeholder' => 'contoh: nav.vehicle',
            'customization.navbar.href_placeholder' => '/admin/vehicles',
            'customization.navbar.activate' => 'Aktifkan',
            'customization.navbar.deactivate' => 'Nonaktifkan',
            'admin.vehicle_types.title' => 'Kategori Kendaraan',
            'admin.vehicle_types.description' => 'Kelola kategori kendaraan untuk sistem parkir Anda.',
            'admin.vehicle_types.add' => 'Tambah Kategori',
            'admin.vehicle_types.empty' => 'Belum ada data kendaraan...',
            'admin.vehicle_types.confirm_delete' => 'Yakin ingin menghapus jenis kendaraan ini?',
            'admin.vehicle_types.create_title' => 'Tambah Kategori Kendaraan',
            'admin.vehicle_types.edit_title' => 'Edit Kategori Kendaraan',
            'admin.vehicle_types.update' => 'Update Data',
            'admin.vehicle_types.fields.name' => 'Nama Kategori',
            'admin.vehicle_types.fields.name_placeholder' => 'Contoh: Mobil Sedan, Motor Sport...',
            'admin.vehicle_types.fields.description' => 'Deskripsi',
            'admin.vehicle_types.fields.description_placeholder' => 'Berikan keterangan singkat mengenai kategori ini...',
            'admin.vehicles.title' => 'Kendaraan',
            'admin.vehicles.description' => 'Kelola data kendaraan dan kategori kendaraan.',
            'admin.vehicles.add' => 'Tambah Kendaraan',
            'admin.vehicles.search_placeholder' => 'Cari plat atau kategori kendaraan...',
            'admin.vehicles.confirm_delete' => 'Yakin ingin menghapus kendaraan ini?',
            'admin.vehicles.update' => 'Update Data',
            'admin.vehicles.filters.all_types' => 'Semua Kategori',
            'admin.vehicles.empty' => 'Tidak ada data kendaraan yang cocok dengan filter.',
            'admin.vehicles.modal.edit_title' => 'Edit Kendaraan',
            'admin.vehicles.modal.create_title' => 'Tambah Kendaraan',
            'admin.vehicles.fields.license_plate_placeholder' => 'Contoh: B 1234 CD',
            'admin.vehicles.fields.vehicle_type_placeholder' => 'Pilih kategori kendaraan',
            'admin.vehicles.batch.row_title' => 'Kendaraan #{n}',
            'admin.vehicles.batch.add_row' => 'Tambah Baris',
            'admin.vehicles.batch.save_all' => 'Simpan Semua',
            'admin.parking_rates.title' => 'Tarif Parkir',
            'admin.parking_rates.description' => 'Kelola tarif parkir berdasarkan kategori kendaraan dan area parkir.',
            'admin.parking_rates.add' => 'Tambah Tarif',
            'admin.parking_rates.empty' => 'Belum ada data tarif kendaraan...',
            'admin.parking_rates.update' => 'Update Data',
            'admin.parking_rates.confirm_delete' => 'Yakin ingin menghapus tarif parkir ini?',
            'admin.parking_rates.per_hour_suffix' => '/ jam',
            'admin.parking_rates.modal.edit_title' => 'Edit Tarif Parkir',
            'admin.parking_rates.modal.create_title' => 'Tambah Tarif Parkir',
            'admin.parking_rates.fields.vehicle_type_placeholder' => 'Pilih kategori kendaraan',
            'admin.parking_rates.fields.location_placeholder' => 'Pilih lokasi parkir',
            'admin.parking_rates.fields.rate_per_hour' => 'Tarif Per Jam',
            'admin.parking_rates.fields.flat_rate' => 'Tarif Tetap',
            'admin.parking_rates.fields.rate_per_hour_placeholder' => 'Contoh: Rp 5.000',
            'admin.parking_rates.fields.flat_rate_placeholder' => 'Contoh: Rp 20.000',
            'admin.accounts.title' => 'Kelola Akun',
            'admin.accounts.description' => 'Kelola user, role, dan identitas RFID.',
            'admin.accounts.create' => 'Buat Akun',
            'admin.accounts.search_placeholder' => 'Cari nama, email, role, atau RFID...',
            'admin.accounts.empty' => 'Belum ada akun yang cocok.',
            'admin.accounts.actions.activate' => 'Aktivasi Akun',
            'admin.accounts.actions.close_action_menu' => 'Tutup menu aksi',
            'admin.accounts.actions.insert_rfid' => 'Input RFID',
            'admin.accounts.actions.switch_rfid' => 'Ganti RFID',
            'admin.accounts.actions.reset_email' => 'Ganti Email',
            'admin.accounts.actions.deactivate' => 'Nonaktifkan Akun',
            'admin.accounts.actions.delete_user' => 'Hapus User',
            'admin.accounts.confirm.title' => 'Konfirmasi',
            'admin.accounts.confirm.generic_desc' => 'Lanjutkan aksi ini?',
            'admin.accounts.confirm.primary' => 'Konfirmasi',
            'admin.accounts.confirm.delete_title' => 'Hapus Akun',
            'admin.accounts.confirm.delete_desc' => 'Yakin mau hapus user ini{name}? Tindakan ini tidak bisa dibatalkan.',
            'admin.accounts.confirm.deactivate_title' => 'Nonaktifkan Akun',
            'admin.accounts.confirm.deactivate_desc' => 'Nonaktifkan akun ini{name}? User tidak bisa login sampai diaktifkan kembali.',
            'admin.accounts.confirm.deactivate_btn' => 'Nonaktifkan',
            'admin.accounts.rfid.title_insert' => 'Input RFID',
            'admin.accounts.rfid.title_switch' => 'Ganti RFID',
            'admin.accounts.rfid.current' => 'RFID aktif sekarang',
            'admin.accounts.rfid.placeholder' => 'Scan / input RFID UID',
            'admin.accounts.rfid.help' => 'Pastikan perangkat input RFID sudah terpasang dengan baik dan aman sebelum melakukan penyimpanan UID.',
            'admin.accounts.rfid.btn_save' => 'Simpan RFID',
            'admin.accounts.rfid.btn_switch' => 'Ganti RFID',
            'admin.accounts.email.title' => 'Reset Email',
            'admin.accounts.email.new_email' => 'Email Baru',
            'admin.accounts.email.help' => 'Setelah email diubah, sistem akan mengirim link untuk set password awal kembali.',
            'admin.accounts.email.btn_save' => 'Simpan Email',
            'admin.accounts.create_modal.title' => 'Buat Akun',
            'admin.accounts.create_modal.name_placeholder' => 'Nama lengkap',
            'admin.accounts.create_modal.rfid_optional' => 'RFID UID (Opsional)',
            'admin.accounts.create_modal.help' => 'Setelah akun dibuat, sistem akan mengirim link aktivasi ke email user untuk set password awal.',
            'admin.accounts.create_modal.btn_create' => 'Buat Akun',
            'admin.dashboard.title' => 'Beranda Admin',
            'admin.dashboard.description' => 'Ringkasan readiness sistem dan kesehatan master data admin.',
            'admin.dashboard.setup.rate_coverage' => 'Cakupan Tarif',
            'admin.dashboard.setup.rate_coverage_subtitle' => 'Kombinasi terkonfigurasi',
            'admin.dashboard.setup.area_incomplete_rate' => 'Area Tanpa Tarif Lengkap',
            'admin.dashboard.setup.area_incomplete_rate_subtitle' => 'Perlu lengkapi tarif per lokasi',
            'admin.dashboard.setup.officer_active' => 'Officer Aktif',
            'admin.dashboard.setup.officer_active_subtitle' => 'Total officer',
            'admin.dashboard.setup.data_alert' => 'Data Diwaspadai',
            'admin.dashboard.setup.data_alert_subtitle' => 'Cek plate duplikat/area invalid',
            'admin.dashboard.master.location_total' => 'Lokasi Parkir',
            'admin.dashboard.master.location_total_subtitle' => 'Total lokasi aktif',
            'admin.dashboard.master.area_total' => 'Area Parkir',
            'admin.dashboard.master.area_total_subtitle' => 'Total area terdaftar',
            'admin.dashboard.master.vehicle_type_total' => 'Kategori Kendaraan',
            'admin.dashboard.master.vehicle_type_total_subtitle' => 'Kategori kendaraan aktif',
            'admin.dashboard.master.rate_completeness' => 'Kelengkapan Tarif',
            'admin.dashboard.master.rate_completeness_subtitle' => 'Kelengkapan tarif lintas lokasi',
            'admin.dashboard.chart.vehicle' => 'Kendaraan',
            'admin.dashboard.chart.parking' => 'Parkir',
            'admin.dashboard.chart.total_data' => 'Jumlah Data',
            'admin.activity_logs.title' => 'Log Aktivitas',
            'admin.activity_logs.description' => 'Riwayat aktivitas user pada sistem.',
            'admin.activity_logs.search_placeholder' => 'Cari aktivitas, nama user, atau email...',
            'admin.activity_logs.empty' => 'Tidak ada log aktivitas yang cocok dengan filter.',
            'admin.activity_logs.confirm_delete' => 'Yakin ingin menghapus log aktivitas ini?',
            'admin.category.parking.title' => 'Ringkasan Parkir',
            'admin.category.parking.description' => 'Halaman ringkasan untuk semua modul parkir.',
            'admin.category.parking.locations_title' => 'Lokasi Parkir',
            'admin.category.parking.locations_desc' => 'Kelola lokasi utama parkir.',
            'admin.category.parking.areas_title' => 'Area Parkir',
            'admin.category.parking.areas_desc' => 'Kelola area & slot parkir.',
            'admin.category.parking.rates_title' => 'Tarif Parkir',
            'admin.category.parking.rates_desc' => 'Kelola tarif parkir.',
            'admin.category.parking.prereq_title' => 'Catatan Prasyarat Data',
            'admin.category.parking.prereq_1' => 'Tambah Lokasi Parkir dulu.',
            'admin.category.parking.prereq_2' => 'Tambah Area Parkir setelah location ada.',
            'admin.category.parking.prereq_3' => 'Tambah Tarif Parkir setelah kategori kendaraan + lokasi ada.',
            'admin.category.vehicle.title' => 'Ringkasan Kendaraan',
            'admin.category.vehicle.description' => 'Halaman ringkasan untuk semua modul kendaraan.',
            'admin.category.vehicle.vehicles_title' => 'Kendaraan',
            'admin.category.vehicle.vehicles_desc' => 'Kelola data kendaraan pengguna.',
            'admin.category.vehicle.types_title' => 'Kategori Kendaraan',
            'admin.category.vehicle.types_desc' => 'Kelola kategori kendaraan.',
            'admin.category.vehicle.prereq_title' => 'Catatan Prasyarat Data',
            'admin.category.vehicle.prereq_1' => 'Tambah Kategori Kendaraan dulu.',
            // 'admin.category.vehicle.prereq_2' => 'Tambah Vehicle setelah type dan owner aktif tersedia.',
            'admin.parking_locations.title' => 'Lokasi Parkir',
            'admin.parking_locations.description' => 'Kelola lokasi parkir untuk sistem parkir Anda.',
            'admin.parking_locations.add' => 'Tambah Lokasi',
            'admin.parking_locations.empty' => 'Belum ada data lokasi parkir...',
            'admin.parking_locations.confirm_delete' => 'Yakin ingin menghapus lokasi parkir ini?',
            'admin.parking_locations.coords_unavailable' => 'Koordinat belum tersedia',
            'admin.parking_locations.create_title' => 'Buat Lokasi Parkir',
            'admin.parking_locations.edit_title' => 'Edit Lokasi Parkir',
            'admin.parking_locations.update' => 'Update Data',
            'admin.parking_locations.fields.name' => 'Nama Lokasi',
            'admin.parking_locations.fields.name_placeholder' => 'Contoh: Mall A Lantai 2',
            'admin.parking_locations.fields.from_map' => 'Otomatis dari peta.',
            'admin.parking_locations.fields.description_placeholder' => 'Berikan keterangan singkat lokasi ini...',
            'admin.parking_areas.title' => 'Area Parkir',
            'admin.parking_areas.description' => 'Kelola area parkir untuk sistem parkir Anda.',
            'admin.parking_areas.add' => 'Tambah Area',
            'admin.parking_areas.empty' => 'Belum ada data area parkir...',
            'admin.parking_areas.confirm_delete' => 'Yakin ingin menghapus area parkir ini?',
            'admin.parking_areas.ticket_penalty' => 'Denda Tiket',
            'admin.parking_areas.create_title' => 'Buat Area Parkir',
            'admin.parking_areas.edit_title' => 'Edit Area Parkir',
            'admin.parking_areas.update' => 'Update Data',
            'admin.parking_areas.fields.name' => 'Nama Area',
            'admin.parking_areas.fields.name_placeholder' => 'Contoh: Basement A, Lantai 3 Zona B',
            'admin.parking_areas.fields.location_placeholder' => 'Pilih lokasi parkir',
            'admin.parking_areas.fields.capacity_placeholder' => 'Contoh: 120',
            'admin.parking_areas.fields.ticket_penalty' => 'Denda Tiket (Rp)',
            'admin.parking_areas.fields.ticket_penalty_placeholder' => 'Contoh: Rp 10.000',
        ];
    }

    private function defaultNavbar(): array
    {
        return [
            'items' => [
                [
                    'key' => 'dashboard',
                    'type' => 'link',
                    'href' => '/admin',
                    'label_key' => 'nav.dashboard',
                    'roles' => ['admin'],
                    'active' => true,
                ],
                [
                    'key' => 'vehicle',
                    'type' => 'group',
                    'label_key' => 'nav.vehicle',
                    'roles' => ['admin'],
                    'active' => true,
                    'children' => [
                        ['key' => 'vehicle_overview', 'href' => '/admin/vehicle', 'label_key' => 'nav.vehicle.overview', 'active' => true],
                        ['key' => 'vehicle_types', 'href' => '/admin/vehicle-types', 'label_key' => 'nav.vehicle.types', 'active' => true],
                        ['key' => 'vehicles', 'href' => '/admin/vehicles', 'label_key' => 'nav.vehicle.vehicles', 'active' => true],
                    ],
                ],
                [
                    'key' => 'parking',
                    'type' => 'group',
                    'label_key' => 'nav.parking',
                    'roles' => ['admin'],
                    'active' => true,
                    'children' => [
                        ['key' => 'parking_overview', 'href' => '/admin/parking', 'label_key' => 'nav.parking.overview', 'active' => true],
                        ['key' => 'parking_locations', 'href' => '/admin/parking-locations', 'label_key' => 'nav.parking.locations', 'active' => true],
                        ['key' => 'parking_areas', 'href' => '/admin/parking-areas', 'label_key' => 'nav.parking.areas', 'active' => true],
                        ['key' => 'parking_rates', 'href' => '/admin/parking-rates', 'label_key' => 'nav.parking.rates', 'active' => true],
                    ],
                ],
                [
                    'key' => 'activity_logs',
                    'type' => 'link',
                    'href' => '/admin/activity-logs',
                    'label_key' => 'nav.activity_logs',
                    'roles' => ['admin'],
                    'active' => true,
                ],
                [
                    'key' => 'accounts',
                    'type' => 'link',
                    'href' => '/admin/accounts',
                    'label_key' => 'nav.accounts',
                    'roles' => ['admin'],
                    'active' => true,
                ],
                [
                    'key' => 'customization',
                    'type' => 'link',
                    'href' => '/admin/customization',
                    'label_key' => 'nav.customization',
                    'roles' => ['admin'],
                    'active' => true,
                ],
            ],
        ];
    }
}
