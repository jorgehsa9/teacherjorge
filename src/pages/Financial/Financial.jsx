import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TeacherFinancial from './components/TeacherFinancial';
import StudentFinancial from './components/StudentFinancial';

const Financial = () => {
  const { isTeacher } = useAuth();
  
  if (isTeacher) {
    return <TeacherFinancial />;
  } else {
    return <StudentFinancial />;
  }
};

export default Financial;
