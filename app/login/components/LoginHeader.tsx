import Image from "next/image";
import { CardHeader, CardTitle } from "@/components/ui/card";

export function LoginHeader() {
  return (
    <CardHeader className="text-center">
      <div className="w-60 h-30 mx-auto">
        <Image
          src="/icon/MSF_logo_square.png"
          alt="MSF Logo"
          width={200}
          height={200}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      <CardTitle className="text-2xl font-bold">MSF Msafiri Admin</CardTitle>
      <p className="text-sm text-muted-foreground">
        Super Admin Portal Access
      </p>
    </CardHeader>
  );
}