import { v4 as uuidv4 } from 'uuid';

export const getMachineId = () => {
  let machineId = localStorage.getItem('machine_id');
  if (!machineId) {
    machineId = uuidv4();
    localStorage.setItem('machine_id', machineId);
  }
  return machineId;
};
