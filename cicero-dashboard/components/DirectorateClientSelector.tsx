"use client";
import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

interface ClientOption {
  client_id: string;
  nama_client: string;
}

interface DirectorateClientSelectorProps {
  clients: ClientOption[];
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  label?: string;
}

export default function DirectorateClientSelector({
  clients,
  selectedClientId,
  onClientChange,
  label = "Pilih Client / Satker",
}: DirectorateClientSelectorProps) {
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) =>
      a.nama_client.localeCompare(b.nama_client, "id", { sensitivity: "base" })
    );
  }, [clients]);

  if (clients.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <label
        htmlFor="client-selector"
        className="text-sm font-semibold text-gray-700"
      >
        {label}:
      </label>
      <div className="relative">
        <select
          id="client-selector"
          value={selectedClientId}
          onChange={(e) => onClientChange(e.target.value)}
          className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Semua Client / Satker</option>
          {sortedClients.map((client) => (
            <option key={client.client_id} value={client.client_id}>
              {client.nama_client}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          strokeWidth={2}
        />
      </div>
    </div>
  );
}
