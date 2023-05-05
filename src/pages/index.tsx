import { type NextPage } from "next";
import Head from "next/head";
import { SignInButton, useUser } from "@clerk/nextjs";
import { RouterOutputs, api } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingSpinner } from "~/components/Loading";
import { useState } from "react";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  // Because post was cached before, so we only use context to call data
  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.post.getAll.invalidate();
    }
  });

  const [input, setInput] = useState<string>('');

  const handlePressInput = () => {
    mutate({content: input})
  }

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        width={50}
        height={50}
        className="h-14 w-14 rounded-full"
        src={user.profileImageUrl}
        alt="avatar"
      />
      <input
        type="text"
        className="grow bg-transparent outline-none"
        placeholder="What's happening?"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
      />
      <button onClick={handlePressInput}>Post</button>
    </div>
  );
};

type PostWithUser = RouterOutputs["post"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div className="flex items-center gap-3 border-b-2 border-slate-700 p-4">
      <Image
        width={50}
        height={50}
        src={author?.profileImageUrl}
        alt="Avatar user"
        className="h-14 w-14 rounded-full"
      />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300 items-baseline">
          <span className="font-bold">@{author.username}</span>
          <span>•</span>
          <span className="font-thin text-sm">{dayjs(post.createdAt).fromNow()}</span>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoaded } = api.post.getAll.useQuery();

  if (postsLoaded) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <div>Wrong data</div>;
  }

  return (
    <div className="flex flex-col">
      {data?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // Start fetch asap, because react query only have to fetch data once
  // It can use the cache data
  api.post.getAll.useQuery();

  // Return empty div if user has't loaded yet
  if (!userLoaded) {
    return <div />;
  }

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x-2 border-slate-700 md:max-w-2xl">
          <div className="flex justify-center border-b-2 border-slate-700 p-4">
            {isSignedIn && <CreatePostWizard />}
            {!isSignedIn && <SignInButton />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
