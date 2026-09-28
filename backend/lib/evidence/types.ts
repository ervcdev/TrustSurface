export type AssetType =
  | "stock"
  | "commodity"
  | "currency"
  | "government_security"
  | "etf"
  | "real_estate";

export interface TokenRow {
  cryptoId: number | null;
  symbol: string | null;
  issuerId: string | null;
  issuerName: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
}

export interface AssetInfo {
  website: string | null;
  employees: number | null;
  founded: string | null;
  industry: string | null;
  cik: string | null;
  primaryExchange: string | null;
}

export interface TradfiMarket {
  exchangeId: number;
  exchangeName: string;
}

export type EvidenceResult<T> =
  | { computable: true; value: T; explanation: string }
  | { computable: false; value: null; reason: string };
