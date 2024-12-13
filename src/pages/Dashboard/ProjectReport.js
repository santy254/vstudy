import React, { useEffect, useState } from 'react';
import './ProjectReport.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../api';

const ProjectReport = () => {
  const [userData, setUserData] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupData, setGroupData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [members, setMembers] = useState([]);
  const [chatData, setChatData] = useState([]);
  const [videoData, setVideoData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const [userRes, groupRes] = await Promise.all([
          api.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/group/user-groups', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setUserData(userRes.data);
        setGroupData(groupRes.data.groups || []);
      } catch (err) {
        console.error('Error fetching user or group data:', err);
        setError('Failed to fetch user or group data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchGroupDetails = async (groupId, period = '30d') => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const [memberRes, taskRes, chatRes, videoRes, groupRes] = await Promise.all([
        api.get(`/auth/group-users/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/task/group/${groupId}?period=${period}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/message/group/${groupId}?period=${period}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/videosession/group/${groupId}?period=${period}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/group/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
  
      setSelectedGroup(groupRes.data.group || {});
      setMembers(memberRes.data.users || []);
      setTaskData(taskRes.data.tasks || []);
      setChatData(chatRes.data.messages || []);
      setVideoData(videoRes.data.report || []);
    } catch (err) {
      console.error('Error fetching group details:', err.response || err);
      setError('Failed to fetch group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleGroupClick = (groupId) => {
    fetchGroupDetails(groupId, selectedPeriod);
  };

  const generatePDF = async () => {
    const input = document.getElementById('report-content');
    if (!input) {
      alert('no report content to geerate pdf');
      return;
    }
    const pdf = new jsPDF('p', 'mm', 'a4');
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth ) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.setFontSize(16);
    pdf.text('StudyHub Project Report', 10, 10);

    if (selectedGroup) {
      pdf.setFontSize(14);
      pdf.text(`Group: ${selectedGroup.groupName}`, 10, 20);
      pdf.text(`Description: ${selectedGroup.groupDescription || 'No description available'}`, 10, 30);
    }
while (heightLeft > 0 ) {

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
heightLeft -= pageHeight;
position -= pageHeight;
if (heightLeft > 0) {
  pdf.addPage();
  position = 0;
}
}
    pdf.save(`StudyHub_${selectedGroup?.groupName || 'Unknown'}_Project_Report.pdf`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="project-report">
      <div className="report-header">
        <h1>StudyHub Project Report</h1>
        {selectedGroup && (
          <div>
            <h2>Group: {selectedGroup.groupName}</h2>
            <p><strong>Description:</strong> {selectedGroup.groupDescription || 'No description available'}</p>
          </div>
        )}
        <div className="filter-container">
          <label htmlFor="time-period">Select Time Period:</label>
          <select
            id="time-period"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="14d">Last 14 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        <button className="download-button" onClick={generatePDF}>
          Download PDF
        </button>
      </div>

      <div id="report-content" className="report-content">
        {userData && (
          <section className="report-section">
            <h2>User Profile</h2>
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
          </section>
        )}

        {groupData.length > 0 && (
          <section className="report-section">
            <h2>User Groups</h2>
            <ul>
              {groupData.map((group) => (
                <li key={group._id} onClick={() => handleGroupClick(group._id)}>
                  <strong>{group.groupName}</strong> - {group.groupDescription || 'No description available'}
                </li>
              ))}
            </ul>
          </section>
        )}

        {members.length > 0 && (
          <section className="report-section">
            <h2>Group Members</h2>
            <ul>
              {members.map((member) => (
                <li key={member.userId}>
                  {member.name} ({member.email})
                </li>
              ))}
            </ul>
          </section>
        )}

        {taskData.length > 0 && (
          <section className="report-section">
            <h2>Tasks (Last {selectedPeriod})</h2>
            <ul>
              {taskData.map((task) => (
                <li key={task._id}>
                  <h3>{task.taskName}</h3>
                  <p>{task.description}</p>
                  <p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
                  <p>Priority: {task.priority}</p>
                  <p>Assigned to:{" "}{task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo[0].name : "Unassigned"}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {chatData.length > 0 ? (
          <section className="report-section">
            <h2>Group Chats (Last {selectedPeriod})</h2>
            <ul>
              {chatData.map((message) => (
                <li key={message._id}>
                  <p><strong>{message.sender?.name || 'Unknown sender'}:</strong> {message.content}</p>
                  <p><small>{new Date(message.timestamp).toLocaleString()}</small></p>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="report-section">
            <h2>Group Chats (Last {selectedPeriod})</h2>
            <p>No chats available for this group in the selected period.</p>
          </section>
        )}
 {videoData.length > 0 ? (
  <section className="report-section">
    <h2>Video Sessions (Last {selectedPeriod})</h2>
    <ul>
       {videoData.map((session, index) => {
         const participants = session.participants || [];
         const startDate = new Date(session.startTime);
       
         
         return(
          <li key={session.sessionId}>
             <h3>Session {index + 1}</h3>
            <p><strong>Host:</strong> {session.host.name} ({session.host.email})</p>
            <p><strong>Number of Participants:</strong> {participants.length}</p>
            <p><strong>Messages Exchanged:</strong> {session.messageCount || 0}</p>
            <p><strong>Started:</strong> {startDate.toLocaleString()}</p>
           
            <p><strong>Status:</strong> {session.endTime ? 'Ended' : 'Active'}</p>
            
            {session.chatSummary.length > 0 && (
              <ul>
                <li><strong>Chat Summary:</strong></li>
                {session.chatSummary.map((message, idx) => (
                  <li key={idx}>
                    <p><strong>{message.sender}:</strong> {message.message}</p>
                    
                  </li>
                ))}
              </ul>
                
            )}
              {index < videoData.length - 1 && <hr />} 
          </li>
         );
      })}
    </ul>
  </section>
) : (
  <section className="report-section">
    <h2>Video Sessions (Last {selectedPeriod})</h2>
    <p>No video sessions available for this group in the selected period.</p>
  </section>
)}

      </div>
      </div>
  );
};

export default ProjectReport;
