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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <label
        htmlFor="client-selector"
        className="text-sm font-semibold text-blue-900 whitespace-nowrap"
      >
        {label}
      </label>
      <div className="relative flex-1 sm:max-w-md">
        <select
          id="client-selector"
          value={selectedClientId}
          onChange={(e) => onClientChange(e.target.value)}
          className="w-full appearance-none rounded-xl border-2 border-blue-200/60 bg-gradient-to-br from-white to-blue-50/30 px-4 py-2.5 pr-11 text-sm font-medium text-blue-900 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:shadow-lg"
        >
          <option value="" className="bg-white">
            Semua Client / Satker
          </option>
          {sortedClients.map((client) => (
            <option
              key={client.client_id}
              value={client.client_id}
              className="bg-white"
            >
              {client.nama_client}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg bg-blue-500/10 p-1">
          <ChevronDown
            className="h-4 w-4 text-blue-600"
            strokeWidth={2.5}
          />
        </div>
      </div>
    </div>
  );
}
