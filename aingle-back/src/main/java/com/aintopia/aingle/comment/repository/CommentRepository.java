package com.aintopia.aingle.comment.repository;

import com.aintopia.aingle.comment.domain.Comment;
import com.aintopia.aingle.post.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment>  findByPost_PostId(Long postId);
}
