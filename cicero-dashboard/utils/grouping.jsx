export function groupUsersByKelompok(users) {
  const group = {
    BAG: [],
    SAT: [],
    "SI & SPKT": [],
    POLSEK: [],
  };
  users.forEach(user => {
    const div = (user.divisi || "").toUpperCase();
    if (div.startsWith("BAG")) group.BAG.push(user);
    else if (div.startsWith("SAT")) group.SAT.push(user);
    else if (div.startsWith("SI") || div.startsWith("SPKT")) group["SI & SPKT"].push(user);
    else if (div.startsWith("POLSEK")) group.POLSEK.push(user);
  });
  return group;
}
