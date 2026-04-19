export type QuiteFlag = "--help" | "-h" | "--version" | "-v";

export type GenerateFlag =
  | "--config"
  | "-c"
  | "--log-level"
  | "-l"
  | "--watch"
  | "-w"
  | "--debug"
  | "-d"
  | "--verbose"
  | "-v"
  | "--silent"
  | "-s";

export type ValidateFlag = "--input" | "-i";

export type InitFlag = "--yes" | "-y";

export type AgentStartFlag =
  | "--config"
  | "-c"
  | "--port"
  | "-p"
  | "--host"
  | "--allow-write"
  | "--allow-all";

export type Arg =
  | QuiteFlag
  | GenerateFlag
  | ValidateFlag
  | InitFlag
  | AgentStartFlag;
