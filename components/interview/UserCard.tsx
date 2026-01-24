import Image from "next/image";

interface UserCardProps {
  userName: string;
}

const UserCard = ({ userName }: UserCardProps) => {
  return (
    <div className="card-border">
      <div className="card-content">
        <Image
          src="/profile.svg"
          alt="profile-image"
          width={539}
          height={539}
          className="rounded-full object-cover size-[120px]"
        />
        <h3>{userName}</h3>
      </div>
    </div>
  );
};

export default UserCard;