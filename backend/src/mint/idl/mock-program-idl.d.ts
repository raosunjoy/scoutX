export interface MockProgramIdl {
  version: string;
  name: string;
  instructions: Array<{
    name: string;
    accounts: Array<{
      name: string;
      isMut: boolean;
      isSigner: boolean;
    }>;
    args: Array<{
      name: string;
      type: string;
    }>;
    discriminator: number[] | Uint8Array;
  }>;
  accounts: Array<any>;
  types: Array<any>;
  address: string;
  metadata: {
    name: string;
    version: string;
    spec: string;
  };
}