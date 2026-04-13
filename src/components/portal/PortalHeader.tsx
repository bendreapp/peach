"use client";

interface PortalHeaderProps {
  name: string;
  email?: string;
}

export default function PortalHeader({ name, email }: PortalHeaderProps) {
  return (
    <div className="space-y-1">
      <h1
        className="text-2xl font-bold"
        style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}
      >
        Hi, {name}
      </h1>
      {email && (
        <p className="text-sm" style={{ color: "#8A8480" }}>
          {email}
        </p>
      )}
    </div>
  );
}
