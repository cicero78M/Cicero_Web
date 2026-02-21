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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <label
        htmlFor="client-selector"
        className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
      >
        {label}
      </label>
      <div className="relative flex-1 sm:max-w-md">
        <select
          id="client-selector"
          value={selectedClientId}
          onChange={(e) => onClientChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-sky-200/80 bg-white px-4 py-2.5 pr-11 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-sky-300 hover:shadow-md focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100 focus:shadow-md"
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
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-md bg-sky-500/10 p-1">
          <ChevronDown
            className="h-4 w-4 text-sky-600"
            strokeWidth={2.5}
          />
        </div>
      </div>
    </div>
  );
}
