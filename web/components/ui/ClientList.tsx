"use client";
import React from "react";
import Image from "next/image";

export interface Client {
  id: string;
  name: string;
  profilePic?: string;
  email?: string;
  status?: "online" | "offline" | "busy";
}

export interface ClientListProps {
  clients: Client[];
  onClientClick?: (client: Client) => void;
  className?: string;
}

const ClientList: React.FC<ClientListProps> = ({
  clients,
  onClientClick,
  className = "",
}) => {
  const handleClientClick = (client: Client) => {
    onClientClick?.(client);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {clients.map((client) => (
        <div
          key={client.id}
          onClick={() => handleClientClick(client)}
          className="flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-200 transition-colors cursor-pointer"
        >
          {/* Profile Picture */}
          <div className="relative flex-shrink-0">
            {client.profilePic ? (
              <Image
                src={client.profilePic}
                alt={client.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 text-xs font-medium">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Status Indicator */}
            {client.status && (
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(client.status)}`}
              />
            )}
          </div>

          {/* Client Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {client.name}
            </div>
            {client.email && (
              <div className="text-xs text-gray-500 truncate">
                {client.email}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientList;
