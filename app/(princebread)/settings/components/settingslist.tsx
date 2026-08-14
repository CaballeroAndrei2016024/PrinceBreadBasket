"use client";

import React from "react";
import { useRouter } from "next/navigation";

//What should the settings for my app be?
interface SettingItem {
  id: string;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
}

interface SettingsListProps {
  items: SettingItem[];
}

const SettingsList: React.FC<SettingsListProps> = ({ items }) => {
  const router = useRouter();

  const handleItemClick = (item: SettingItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  const settingsItems = [
    {
      id: "business",
      label: "Business Information",
      description: "For Bakery business..",
      href: "/settings/business",
    },
    {
      id: "sales",
      label: "Sales",
      description: "Configure Sales Transactions.",
      href: "/settings/sales",
    },
    {
      id: "inventory",
      label: "Inventory",
      description: "Configure Inventory Settings.",
      href: "/settings/inventory",
    },
    {
      id: "printing",
      label: "Printing & Receipts",
      description: "Configure Printing.",
      href: "/settings/printing",
    },
    {
      id: "reports",
      label: "Reports",
      description: "Configure Reports.",
      href: "/settings/reports",
    },
    {
      id: "preferences",
      label: "Application Preferences",
      description: "Configure App UI.",
      href: "/settings/preferences",
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto bg-white shadow rounded-lg divide-y divide-gray-200">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleItemClick(item)}
          className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-100"
        >
          <div className="font-medium text-gray-900">{item.label}</div>
          {item.description && (
            <div className="text-sm text-gray-500">{item.description}</div>
          )}
        </button>
      ))}
    </div>
  );
};

export default SettingsList;
