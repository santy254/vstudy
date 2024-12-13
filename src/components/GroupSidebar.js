import React from 'react';
import { FaUsers } from 'react-icons/fa';
import './GroupSidebar.css';

const GroupSidebar = ({ groups = [], onGroupChange, currentGroup }) => {
  return (
    <div className="group-sidebar">
      <h3 className="sidebar-title">Your Groups</h3>
      <ul className="group-list">
        {groups.length > 0 ? (
          groups.map((group) => (
            <li
              key={group._id}
              className={`group-item ${currentGroup === group._id ? 'active' : ''}`}

              onClick={() => onGroupChange(group._id)}
            >
              <FaUsers className="group-icon" />
              <span className="group-name">{group.groupName}</span>
            </li>
          ))
        ) : (
          <li className="group-item">No groups available</li>
        )}
      </ul>
    </div>
  );
};

export default GroupSidebar;