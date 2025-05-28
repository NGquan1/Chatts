import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import GroupInvitationsList from "./GroupInvitationsList";

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-lg shadow-xl border border-base-300 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-xs"
              >
                Close
              </button>
            </div>
            <GroupInvitationsList />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
