const Topbar = ({
  userInfo,
}: {
  userInfo: {
    id: number;
    username?: string;
    role: string;
  };
}) => {
  const firstChar = userInfo?.username?.[0];
  return (
    <div className="h-15 w-full flex justify-end px-6 bg-white shadow-sm">
      <div className="flex gap-3 items-center">
        <div className="rounded-full bg-black text-white size-10 flex items-center justify-center uppercase text-lg">
          {firstChar}
        </div>
        <p>{userInfo?.username || ""}</p>
      </div>
    </div>
  );
};

export default Topbar;
