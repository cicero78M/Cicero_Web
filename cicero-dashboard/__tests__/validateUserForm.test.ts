import { validateNewUser } from "@/utils/validateUserForm";

describe("validateNewUser", () => {
  it("returns sanitized values for valid input", () => {
    const res = validateNewUser({
      nama: "John",
      pangkat: "BRIPDA",
      nrpNip: " 12 345-678 ",
      satfung: "SAT LANTAS",
      polsekName: "",
    });
    expect(res).toEqual({ nrpNip: "12345678", satfungValue: "SAT LANTAS" });
  });

  it("accepts PPPK as a valid pangkat option", () => {
    const res = validateNewUser({
      nama: "Jane",
      pangkat: "PPPK",
      nrpNip: "22222",
      satfung: "SAT LANTAS",
      polsekName: "",
    });

    expect(res).toEqual({ nrpNip: "22222", satfungValue: "SAT LANTAS" });
  });

  it("accepts satfung options exposed in the form", () => {
    const satfungValues = [
      "SUBBID MULTIMEDIA",
      "SUBBID PID",
      "SUBBID PENMAS",
      "SUBDIT DALMAS",
      "SUBDIT GASUM",
      "SUB BAG RENMIN",
      "SUBDIT 1",
      "SUBDIT 2",
      "SUBDIT 3",
      "SUBDIT 4",
      "BAG RENMIN",
      "BAG ANALIS",
      "SIE INTELTEK",
      "SIE YANMIN",
      "SIE SANDI",
    ];

    satfungValues.forEach((satfung) => {
      const res = validateNewUser({
        nama: "John",
        pangkat: "BRIPDA",
        nrpNip: "11111",
        satfung,
        polsekName: "",
      });
      expect(res).toEqual({ nrpNip: "11111", satfungValue: satfung });
    });
  });

  it("returns error for non numeric nrp", () => {
    const res = validateNewUser({
      nama: "Jane",
      pangkat: "BRIPDA",
      nrpNip: "12a45",
      satfung: "SAT LANTAS",
      polsekName: "",
    });
    expect(res.error).toBe("NRP hanya boleh angka");
  });

  it("returns error when sanitized nrp is empty", () => {
    const res = validateNewUser({
      nama: "Empty",
      pangkat: "BRIPDA",
      nrpNip: " -  ",
      satfung: "SAT LANTAS",
      polsekName: "",
    });
    expect(res.error).toBe("NRP/NIP wajib diisi");
  });

  it("returns error for invalid pangkat", () => {
    const res = validateNewUser({
      nama: "Jane",
      pangkat: "UNKNOWN",
      nrpNip: "12345",
      satfung: "SAT LANTAS",
      polsekName: "",
    });
    expect(res.error).toBe("Pangkat tidak valid");
  });

  it("returns error when polsek name is missing", () => {
    const res = validateNewUser({
      nama: "Jane",
      pangkat: "BRIPDA",
      nrpNip: "12345",
      satfung: "POLSEK",
      polsekName: " ",
    });
    expect(res.error).toBe("Nama Polsek wajib diisi");
  });

  it("returns error for invalid satfung", () => {
    const res = validateNewUser({
      nama: "Jane",
      pangkat: "BRIPDA",
      nrpNip: "12345",
      satfung: "UNKNOWN",
      polsekName: "",
    });
    expect(res.error).toBe("Satfung tidak valid");
  });

  it("formats polsek satfung correctly", () => {
    const res = validateNewUser({
      nama: "Jane",
      pangkat: "BRIPDA",
      nrpNip: "12345",
      satfung: "POLSEK",
      polsekName: "Bojonegoro",
    });
    expect(res).toEqual({ nrpNip: "12345", satfungValue: "POLSEK Bojonegoro" });
  });
});
