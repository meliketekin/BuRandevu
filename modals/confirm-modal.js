import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  onClose,
  confirmText = "Tamam",
  cancelText = "İptal",
  /** true → onay butonu kırmızı (silme vb.) */
  destructiveConfirm = false,
  /** { text, onPress, destructive? } → üçüncü buton (opsiyonel) */
  secondaryAction = null,
}) {
  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  const handleConfirm = async () => {
    try {
      await Promise.resolve(onConfirm?.());
    } finally {
      onClose?.();
    }
  };

  const handleSecondary = () => {
    secondaryAction?.onPress?.();
    onClose?.();
  };

  if (secondaryAction) {
    return (
      <View style={styles.overlay}>
        <View style={styles.box}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actionsColumn}>
            <Pressable
              style={[styles.button, styles.fullButton, destructiveConfirm ? styles.confirmButtonDanger : styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.fullButton, secondaryAction.destructive ? styles.confirmButtonDanger : styles.secondaryButton]}
              onPress={handleSecondary}
            >
              <Text style={secondaryAction.destructive ? styles.confirmText : styles.secondaryText}>{secondaryAction.text}</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.fullButton, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelText}>{cancelText}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              destructiveConfirm ? styles.confirmButtonDanger : styles.confirmButton,
            ]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmText}>{confirmText}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#333",
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  actionsColumn: {
    flexDirection: "column",
    gap: 8,
  },
  fullButton: {
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
  },
  secondaryText: {
    color: "#333",
    fontSize: 15,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelText: {
    color: "#333",
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: Colors.PrimaryColor,
  },
  confirmButtonDanger: {
    backgroundColor: Colors.ErrorColor,
  },
  confirmText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
