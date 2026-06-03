export class createUserDTO {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export class updateUserDTO {
  name?: string;
  role?: string;
  active?: boolean;
  password?: string;
}
