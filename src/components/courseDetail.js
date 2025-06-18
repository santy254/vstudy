// src/components/CourseDetail.js
import React from 'react';
import { useParams } from 'react-router-dom';

const CourseDetail = () => {
  const { courseSlug } = useParams();

  return (
    <div>
      <h2>Course Detail</h2>
      <p>You selected: <strong>{courseSlug.replace(/-/g, ' ')}</strong></p>
      {/* Later, fetch course info here using slug */}
    </div>
  );
};

export default CourseDetail;
