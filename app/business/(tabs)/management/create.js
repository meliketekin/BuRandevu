import EmployeeFormScreen from "./employee-form-screen";

export default function CreateEmployee() {
  return (
    <EmployeeFormScreen
      title="Calisan Ekle"
      saveButtonLabel="Calisani Kaydet"
      submitMessage={{
        title: "Taslak Kaydedildi",
        description: "Yeni calisan formu hazirlandi.",
      }}
    />
  );
}
