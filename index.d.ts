export interface CredentialsParams {
  /**
   * The prefixes to look for in the table.
   */
  prefixes?: string[];

  /**
   * The dynamodb table used for credstash.
   */
  table: string;

  /**
   * The AWS_REGION defaults to process.env.AWS_REGION
   */
  region?: string;
}

export interface CredentialResult {
  [key: string] : string
}

export function getSync(params: CredentialsParams) : CredentialResult;
export function get(params: CredentialsParams, callback: (err: Error, result: CredentialResult) => any) : Promise<CredentialResult>;
