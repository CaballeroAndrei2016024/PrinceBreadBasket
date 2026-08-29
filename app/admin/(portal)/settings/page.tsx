import React from "react";
import BizSettings from "./components/bizsettings";

export const metadata = {
  title: "Here is the page for your Settings",
  description: "Edit your company's preferences here.",
};

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center space-y-8 md:px-20">
        <BizSettings />
      </div>
    </div>
  );
};

export default SettingsPage;
