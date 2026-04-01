import EmployeeFormScreen from "./employee-form-screen";

export default function CreateEmployee() {
  return (
    <EmployeeFormScreen
      title="Çalışan ekle"
      saveButtonLabel="Çalışanı kaydet"
      submitMessage={{
        title: "Taslak kaydedildi",
        description: "Yeni çalışan formu hazırlandı.",
      }}
    />
  );
}
