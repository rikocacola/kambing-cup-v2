import { Label } from "@radix-ui/react-label";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";

import { Input } from "~/components/ui/input";

const LoginPage = () => {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <Form className="px-12 py-8 flex flex-col gap-5 border rounded-2xl">
        <div className="grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="email">Email</Label>
          <Input type="email" id="email" placeholder="Email" />
        </div>
        <div className="grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="password">Password</Label>
          <Input type="password" id="password" placeholder="Password" />
        </div>
        <Button type="submit">Log in</Button>
      </Form>
    </div>
  );
};

export default LoginPage;
