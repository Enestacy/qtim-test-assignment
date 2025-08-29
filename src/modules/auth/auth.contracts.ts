import { LoginDto, RegisterDto } from './dto';
import { TokensData } from './types';

export class LoginRequest extends LoginDto {}
export type LoginResponse = TokensData;

export type RefreshResponse = TokensData;

export class RegisterRequest extends RegisterDto {}
export type RegisterResponse = TokensData;
