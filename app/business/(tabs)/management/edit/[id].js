import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import EmployeeFormScreen from "../employee-form-screen";
import { EMPLOYEES } from "../employees-data";

export default function EditEmployee() {
  const { id } = useLocalSearchParams();
  const employeeId = Array.isArray(id) ? id[0] : id;

  const employee = useMemo(
    () => EMPLOYEES.find((item) => item.id === employeeId) ?? EMPLOYEES[0],
    [employeeId]
  );

  return (
    <EmployeeFormScreen
      title="Calisani Duzenle"
      saveButtonLabel="Degisiklikleri Kaydet"
      submitMessage={{
        title: "Guncellendi",
        description: "Calisan bilgileri guncellendi.",
      }}
      employee={employee}
    />
  );
}
