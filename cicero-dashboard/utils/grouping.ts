export interface User {
  divisi?: string;
  [key: string]: any;
}

export interface KelompokGroups {
  BAG: User[];
  SAT: User[];
  'SI & SPKT': User[];
  POLSEK: User[];
}

export function groupUsersByKelompok(users: User[]): KelompokGroups {
  const group: KelompokGroups = { BAG: [], SAT: [], 'SI & SPKT': [], POLSEK: [] };
  users.forEach((user) => {
    const div = (user.divisi || '').toUpperCase();
    if (div.startsWith('BAG')) group.BAG.push(user);
    else if (div.startsWith('SAT')) group.SAT.push(user);
    else if (div.startsWith('SI') || div.startsWith('SPKT')) group['SI & SPKT'].push(user);
    else if (div.startsWith('POLSEK')) group.POLSEK.push(user);
  });
  return group;
}
