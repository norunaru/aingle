import bar from "../../assets/imgs/swipeBar.png";
import Postcomment from "./Postcomment";
import clap from "../../assets/icons/comment/clap.png";
import fire from "../../assets/icons/comment/fire.png";
import face from "../../assets/icons/comment/face.png";
import left from "../../assets/icons/comment/left.png";
import redHeart from "../../assets/icons/comment/redHeart.png";
import send from "../../assets/icons/comment/send.png";
import thumb from "../../assets/icons/comment/thumb.png";
import { useState, useRef, useEffect } from "react";
import { IComment, IcreateComment } from "../../model/comment";
import { getComments, createComment, createReply } from "../../api/commentAPI";
import ReplyComment from "./ReplyComment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface PostCommentModalProps {
  id: number;
  closeFn: () => void;
}

const PostCommentModal: React.FC<PostCommentModalProps> = ({ id, closeFn }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const CLOSE_THRESHOLD = 100;

  const [comments, setComments] = useState<IComment[]>([]);
  const [commentId, setCommentId] = useState(0);
  const [commentWriter, setCommentWriter] = useState("");

  const [inputComment, setInputcomment] = useState<IcreateComment>({
    postId: id,
    content: "",
  });

  const handleChange = (
    field: keyof IcreateComment,
    value: string | number | null
  ) => {
    setInputcomment((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmojiClick = (emoji: string) => {
    setInputcomment((prev) => ({
      ...prev,
      content: prev.content + emoji, // 기존 내용에 이모티콘 추가
    }));
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY.current;
    if (deltaY > CLOSE_THRESHOLD) {
      setIsDragging(false);
      closeFn(); // Close modal when dragged down past threshold
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    e.preventDefault();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > CLOSE_THRESHOLD) {
      setIsDragging(false);
      closeFn(); // Close modal when dragged down past threshold
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  // 모달창 띄워질때 댓글 목록 가져오기
  useEffect(() => {
    const fetchComment = async () => {
      try {
        const response = await getComments(id);
        setComments(response);
      } catch (error) {
        console.error("댓글 조회 실패 : ", error);
      }
    };

    fetchComment();
  }, [id]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
      document.body.style.cursor = "ns-resize";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.body.style.cursor = "default";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.body.style.cursor = "default";
    };
  }, [isDragging]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (commentId === 0) {
        // 일반 댓글 작성
        await createComment(inputComment);
        
      } else {
        // 답글 작성
        await createReply(commentId, inputComment.content);
      }

      // 댓글 목록 다시 가져오기
      const updatedComments = await getComments(id);
      setComments(updatedComments);

      // 입력 초기화
      setInputcomment((prev) => ({
        ...prev,
        content: "",
      }));
      setCommentId(0); // 답글 작성 후 commentId 초기화
      setCommentWriter("");
    } catch (error) {
      console.error("댓글 등록 실패 : ", error);
    }
  };

  if (comments === null) {
    return null; // comments가 null인 동안 아무것도 렌더링하지 않음
  }

  return (
    <div ref={containerRef} className="absolute top-0 left-0 w-full h-full">
      {/* Background overlay */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-black opacity-50 z-20 px-[16px] transition-opacity duration-300"
        onClick={closeFn}
      ></div>
      <div
        ref={modalRef}
        className="z-30 bg-white rounded-t-lg absolute bottom-0 w-full overflow-auto transition-all duration-300 ease"
        style={{ height: `90%` }}
      >
        {/* Drag bar */}
        <div
          className="w-full flex justify-center items-center border-b-[1px] border-[#A6A6A6] h-[60px] relative pb-5 cursor-ns-resize touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="separator"
          aria-orientation="horizontal"
          aria-label="댓글 모달 높이 조절"
        >
          <img
            src={bar}
            className="absolute top-[15px] mb-[10px] w-[48px] h-[5px]"
            alt="drag bar"
          />
          <h1 className="font-semibold absolute top-[30px]">
            댓글 {comments.length}
          </h1>
        </div>
        <div
          className="px-[18px] pt-[25px] overflow-y-auto"
          style={{ maxHeight: "60vh" }}
        >
          {comments.map((comment, idx) => (
            <div
              key={idx}
              onClick={() => {
                setCommentId(comment.commentId);
                setCommentWriter(
                  comment.member?.name ||
                    comment.character?.name ||
                    "Unknown User"
                );
              }}
            >
              <Postcomment key={comment.commentId} comment={comment} />
              {comment.replies &&
                comment.replies.map((reply, idx) => {
                  return <ReplyComment key={idx} comment={reply} />;
                })}
            </div>
          ))}
        </div>

        {/* Icons and comment input */}
        <div className="w-full absolute bottom-0 bg-white z-40 pt-[10px] ">
          {commentWriter != "" && (
            <div
              className="px-5 py-2 mb-3 text-white flex justify-between items-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
              <h1>{commentWriter}에 답글 작성</h1>

              <FontAwesomeIcon
                icon={faXmark}
                onClick={() => {
                  setCommentId(0);
                  setCommentWriter("");
                }}
              />
            </div>
          )}
          <div className="flex w-full justify-between px-[45px] box-border mb-[15px]">
            <img
              src={redHeart}
              className="w-[24px] cursor-pointer"
              alt="redHeart"
              onClick={() => handleEmojiClick("❤️")} 
            />
            <img
              src={face}
              className="w-[24px] cursor-pointer"
              alt="face"
              onClick={() => handleEmojiClick("😊")} 
            />
            <img
              src={clap}
              className="w-[24px] cursor-pointer"
              alt="clap"
              onClick={() => handleEmojiClick("👏")} 
            />
            <img
              src={fire}
              className="w-[24px] cursor-pointer"
              alt="fire"
              onClick={() => handleEmojiClick("🔥")} 
            />
            <img
              src={thumb}
              className="w-[24px] cursor-pointer"
              alt="thumb"
              onClick={() => handleEmojiClick("👍")} 
            />
          </div>
          <div className="w-full h-full flex items-center justify-center space-x-[10px] pb-[57px]">
            <img
              src={left}
              className="w-[35px] h-[35px] rounded-full"
              alt="left"
            />
            <form onSubmit={handleSubmit}>
              <input
                onChange={(e) => handleChange("content", e.target.value)}
                value={inputComment.content}
                required
                type="text"
                placeholder="댓글 달기"
                className="border-[#CFCFCF] border-[1px] h-[34px] px-[15px] rounded-full"
              />
            </form>
            <img
              onClick={handleSubmit}
              src={send}
              className="w-[30px] h-[30px] rounded-full cursor-pointer"
              alt="send"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCommentModal;
// 😂❤️🔥👍👏
