import { Logger } from "ts-log";
import * as fs from "fs";


/**
 * Log to
 * File
 * Console
 * 
 * C'est un singleton
 */
export class FileLogger implements Logger {
  private readonly fd: number;

  private static logger: FileLogger;
  private static logFilePath: string = './logs/info.log';

  public static getInstance(): FileLogger {
    if (!this.logger) {
      this.logger = new FileLogger(this.logFilePath);
    }
    return this.logger;
  }

  public constructor(filename: string) {
    this.fd = fs.openSync(filename, "a");
  }

  public trace(message?: any, ...optionalParams: any[]): void {
    this.append("TRACE", `${message}`);
  }

  public debug(message?: any, ...optionalParams: any[]): void {
    this.append("DEBUG", `${message}`);
  }

  public info(message?: any, ...optionalParams: any[]): void {
    this.append("INFO ", `${message}`);
  }

  public warn(message?: any, ...optionalParams: any[]): void {
    this.append("WARN ", `${message}`);
  }

  public error(message?: any, ...optionalParams: any[]): void {
    this.append("ERROR", `${message}`);
  }

  private append(type: string, message: string) {
    const msg: string = `${new Date().toISOString()} ${type} ${message}`;
    fs.writeSync(this.fd, msg + '\n');
    console.log(msg)
  }
}