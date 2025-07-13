import React from "react";
import { Button } from "antd";

export default function GenderButton({ value, icon, label, selected, onClick }) {
    return (
        <Button
            type={selected ? "primary" : "default"}
            icon={icon}
            onClick={() => onClick(value)}
            size="large"
            block
        >
            {label}
        </Button>
    );
}
