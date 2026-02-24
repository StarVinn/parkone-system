import { useForm } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";

export default function Edit({ vehicleType }) {
    const { data, setData, put, errors, processing } = useForm({
        name: vehicleType.name,
        description: vehicleType.description ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("vehicle-types.update", vehicleType.id));
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Edit Vehicle Type</h1>

            <form onSubmit={submit} className="space-y-4 max-w-lg">
                <div>
                    <label className="block mb-1">Name</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        className="border p-2 w-full rounded"
                    />
                    {errors.name && (
                        <div className="text-red-500 text-sm">
                            {errors.name}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block mb-1">Description</label>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData("description", e.target.value)}
                        className="border p-2 w-full rounded"
                    />
                </div>

                <button
                    disabled={processing}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Update
                </button>
            </form>
        </div>
    );
}

Edit.layout = (page) => <AdminLayout children={page} />;
