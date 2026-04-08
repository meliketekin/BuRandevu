import { Modal, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { modalStore } from "@/stores/modal-store";
import ConfirmModal from "@/modals/confirm-modal";
import SelectModal from "@/modals/select-modal";
import { ModalTypeEnum } from "@/enums/modal-type-enum";

/**
 * Kayıtlı modal tipleri. Yeni modal eklemek için modal-type-enum'a ekle,
 * modals/ klasörüne component ekleyip MODAL_REGISTRY'ye ekle.
 *
 * rawContainer: true → ModalRenderer container View'unu bypass eder;
 *   modal kendi arkaplanını ve animasyonunu yönetir (SelectModal gibi).
 */
const MODAL_REGISTRY = {
  [ModalTypeEnum.ConfirmModal]: { Component: ConfirmModal, animationType: "fade" },
  [ModalTypeEnum.SelectModal]: { Component: SelectModal, animationType: "none", rawContainer: true },
};

/**
 * Global modal renderer. Root layout'ta bir kez kullan.
 * Store'daki current modal'ı Modal içinde render eder; her modal'a onClose prop'u geçilir.
 */
export function ModalRenderer() {
  const current = modalStore((state) => state.current);
  const close = modalStore((state) => state.close);

  if (!current) return null;

  const entry = MODAL_REGISTRY[current.type];
  if (!entry) return null;

  const { Component, animationType = "fade", rawContainer = false } = entry;

  const handleClose = () => {
    close();
    current.props?.onClose?.();
  };

  return (
    <Modal visible transparent animationType={animationType} statusBarTranslucent onRequestClose={handleClose}>
      {rawContainer ? (
        <Component {...current.props} onClose={handleClose} />
      ) : (
        <View style={styles.container}>
          <Component {...current.props} onClose={handleClose} />
        </View>
      )}
    </Modal>
  );
}

/**
 * Modal açıp kapatmak için hook / helper.
 * Örnek: const modal = useModal(); modal.open('confirm', { title: 'Sil?', onConfirm: ... });
 */
export function useModal() {
  return {
    open: modalStore.getState().open,
    close: modalStore.getState().close,
  };
}

/** Modal aç: openModal(ModalTypeEnum.ConfirmModal, { ...props }) */
export const openModal = (type, props) => modalStore.getState().open(type, props);

/** Modal kapat */
export const closeModal = () => modalStore.getState().close();

export { modalStore, ModalTypeEnum };

export default ModalRenderer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
