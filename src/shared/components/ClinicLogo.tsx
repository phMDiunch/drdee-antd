// src/shared/components/ClinicLogo.tsx
"use client";

interface ClinicLogoProps {
  size?: number;
}

export default function ClinicLogo({ size = 40 }: ClinicLogoProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: "#1890ff",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: size / 3,
      }}
    >
      🦷
    </div>
  );
}
