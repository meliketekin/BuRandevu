import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "@/components/snackbar/snackbar";
import { CommandTypeEnum } from "@/enums/command-type-enum";
import useCommandBusListener from "@/hooks/use-command-bus-listener";

const HIDE_DELAY_MS = 180;

const createAlertKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function AlertRenderer() {
  const [alerts, setAlerts] = useState([]);
  const timersRef = useRef({});

  const removeAlert = useCallback((key) => {
    const timer = timersRef.current[key];

    if (timer) {
      clearTimeout(timer);
      delete timersRef.current[key];
    }

    setAlerts((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const onDismissDynamic = useCallback(
    (key) => () => {
      setAlerts((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, visible: false } : item
        )
      );

      if (!timersRef.current[key]) {
        timersRef.current[key] = setTimeout(() => {
          removeAlert(key);
        }, HIDE_DELAY_MS);
      }
    },
    [removeAlert]
  );

  useCommandBusListener(
    CommandTypeEnum.Alert,
    useCallback((payload = {}) => {
      setAlerts((prev) => [
        ...prev,
        {
          key: createAlertKey(),
          visible: true,
          type: payload.type || "warning",
          title: payload.title,
          message: payload.message,
          duration: payload.time || 2000,
        },
      ]);
    }, [])
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  if (!alerts.length) return null;

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {[...alerts].slice(-3).map((item, index, list) => {
        const isBottomItem = index === list.length - 1;
        const topOffset = index * 88;

        return (
          <Toast
            key={item.key}
            visible={item.visible}
            duration={item.duration}
            onDismiss={onDismissDynamic(item.key)}
            position="top"
            type={item.type}
            title={item.title}
            wrapperStyle={[
              styles.toastWrapper,
              { marginTop: topOffset },
              !isBottomItem ? styles.stackedItem : undefined,
            ]}
          >
            {item.message}
          </Toast>
        );
      })}
    </View>
  );
}

export default AlertRenderer;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 999,
    elevation: 999,
  },
  stackedItem: {
    paddingTop: 0,
  },
  toastWrapper: {
    left: 0,
    right: 0,
  },
});
