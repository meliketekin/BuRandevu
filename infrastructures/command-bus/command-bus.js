import { EventEmitter } from "events";
import { CommandTypeEnum } from "@/enums/command-type-enum";

class CommandBus {
  static staticClass = new CommandBus();

  static sc = CommandBus.staticClass;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(100);
  }

  publish = (commandType, payload) => {
    this.eventEmitter.emit(commandType?.toString(), payload);
  };

  subscribe = (commandType, listener) => {
    const eventName = commandType?.toString();

    if (!eventName || typeof listener !== "function") {
      return () => {};
    }

    this.eventEmitter.addListener(eventName, listener);

    return () => {
      this.eventEmitter.removeListener(eventName, listener);
    };
  };

  alertError = (title, message, time) =>
    this.publish(CommandTypeEnum.Alert, {
      type: "error",
      title,
      message,
      time,
    });

  alertSuccess = (title, message, time) =>
    this.publish(CommandTypeEnum.Alert, {
      type: "success",
      title,
      message,
      time,
    });

  alertInfo = (title, message, time) =>
    this.publish(CommandTypeEnum.Alert, {
      type: "warning",
      title,
      message,
      time,
    });
}

export default CommandBus;
