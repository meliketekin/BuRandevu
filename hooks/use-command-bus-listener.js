import { useEffect } from "react";
import CommandBus from "@/infrastructures/command-bus/command-bus";

export default function useCommandBusListener(commandType, listener) {
  useEffect(() => {
    return CommandBus.sc.subscribe(commandType, listener);
  }, [commandType, listener]);
}
