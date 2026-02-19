import AdminLayout from "../Layouts/AdminLayout";

export default function Dashboard() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <p>Selamat datang di dashboard admin.</p>
        </div>
    );
}

Dashboard.layout = (page) => <AdminLayout children={page} />;
