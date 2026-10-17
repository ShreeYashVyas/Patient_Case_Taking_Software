export const initialPatients = [
  {
    id: 'PT-1024', fullName: 'Aarav Mehta', age: 32, gender: 'Male', phone: '+91 98765 01234',
    email: 'aarav.mehta@example.com', bloodGroup: 'B+', lastVisit: 'Oct 16, 2026', status: 'Active',
    chiefComplaint: 'Seasonal allergies',
  },
  {
    id: 'PT-1023', fullName: 'Ananya Rao', age: 27, gender: 'Female', phone: '+91 98220 12345',
    email: 'ananya.rao@example.com', bloodGroup: 'O+', lastVisit: 'Oct 16, 2026', status: 'Active',
    chiefComplaint: 'Routine check-up',
  },
  {
    id: 'PT-1022', fullName: 'Rohan Kapoor', age: 46, gender: 'Male', phone: '+91 97654 12345',
    email: 'rohan.kapoor@example.com', bloodGroup: 'A+', lastVisit: 'Oct 15, 2026', status: 'Follow-up',
    chiefComplaint: 'Blood pressure review',
  },
  {
    id: 'PT-1021', fullName: 'Meera Iyer', age: 35, gender: 'Female', phone: '+91 98901 23456',
    email: 'meera.iyer@example.com', bloodGroup: 'AB+', lastVisit: 'Oct 15, 2026', status: 'Active',
    chiefComplaint: 'Headache',
  },
  {
    id: 'PT-1020', fullName: 'Kabir Shah', age: 19, gender: 'Male', phone: '+91 90012 34567',
    email: 'kabir.shah@example.com', bloodGroup: 'O-', lastVisit: 'Oct 14, 2026', status: 'Active',
    chiefComplaint: 'Sports physical',
  },
  {
    id: 'PT-1019', fullName: 'Diya Nair', age: 52, gender: 'Female', phone: '+91 98111 22334',
    email: 'diya.nair@example.com', bloodGroup: 'B-', lastVisit: 'Oct 13, 2026', status: 'Follow-up',
    chiefComplaint: 'Joint pain review',
  },
  {
    id: 'PT-1018', fullName: 'Ishaan Verma', age: 41, gender: 'Male', phone: '+91 91234 56780',
    email: 'ishaan.verma@example.com', bloodGroup: 'A-', lastVisit: 'Oct 12, 2026', status: 'Active',
    chiefComplaint: 'Cough and cold',
  },
  {
    id: 'PT-1017', fullName: 'Sara Thomas', age: 30, gender: 'Female', phone: '+91 99887 76655',
    email: 'sara.thomas@example.com', bloodGroup: 'O+', lastVisit: 'Oct 10, 2026', status: 'Inactive',
    chiefComplaint: 'General consultation',
  },
];

export const initialAppointments = [
  { id: 'APT-201', time: '09:00 AM', patientId: 'PT-1023', patientName: 'Ananya Rao', reason: 'Routine check-up', status: 'Completed', color: 'mint' },
  { id: 'APT-202', time: '09:30 AM', patientId: 'PT-1024', patientName: 'Aarav Mehta', reason: 'Seasonal allergies', status: 'In progress', color: 'blue' },
  { id: 'APT-203', time: '10:15 AM', patientId: 'PT-1022', patientName: 'Rohan Kapoor', reason: 'BP follow-up', status: 'Upcoming', color: 'orange' },
  { id: 'APT-204', time: '11:00 AM', patientId: 'PT-1021', patientName: 'Meera Iyer', reason: 'Recurring headache', status: 'Upcoming', color: 'violet' },
];

export const initialEncounters = [
  {
    id: 'CS-5081', patientId: 'PT-1024', patientName: 'Aarav Mehta', date: 'Oct 16, 2026',
    chiefComplaint: 'Sneezing and itchy eyes', assessment: 'Allergy symptoms — review required',
    status: 'In progress', followUpDate: 'Oct 23, 2026',
  },
  {
    id: 'CS-5080', patientId: 'PT-1023', patientName: 'Ananya Rao', date: 'Oct 16, 2026',
    chiefComplaint: 'Annual health check-up', assessment: 'Routine review', status: 'Completed', followUpDate: '',
  },
  {
    id: 'CS-5079', patientId: 'PT-1022', patientName: 'Rohan Kapoor', date: 'Oct 15, 2026',
    chiefComplaint: 'Blood pressure monitoring', assessment: 'Review recorded readings', status: 'Follow-up', followUpDate: 'Oct 20, 2026',
  },
  {
    id: 'CS-5078', patientId: 'PT-1021', patientName: 'Meera Iyer', date: 'Oct 15, 2026',
    chiefComplaint: 'Intermittent headache', assessment: 'Clinical evaluation documented', status: 'Completed', followUpDate: '',
  },
  {
    id: 'CS-5077', patientId: 'PT-1019', patientName: 'Diya Nair', date: 'Oct 13, 2026',
    chiefComplaint: 'Joint pain review', assessment: 'Follow-up assessment needed', status: 'Follow-up', followUpDate: 'Oct 19, 2026',
  },
];
