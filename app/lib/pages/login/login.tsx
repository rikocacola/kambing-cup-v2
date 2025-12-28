import { Form } from "react-router";

import { Button } from "~/lib/components/ui/button";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";

import agiLogoBlack from "~/lib/assets/images/agi-logo-black.png";

const LoginPage = () => {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <Form
        className="px-12 py-8 flex flex-col gap-5 border rounded-2xl"
        method="POST"
      >
        <img src={agiLogoBlack} alt="AGI Logo" className="w-32 mx-auto mb-4" />
        <div className="grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="username">Email</Label>
          <Input
            type="text"
            id="username"
            placeholder="Username"
            name="username"
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            id="password"
            placeholder="Password"
            name="password"
          />
        </div>
        <Button type="submit">Log in</Button>
      </Form>
    </div>
  );
};

export default LoginPage;
