package com.aintopia.aingle.common.openai;

import com.aintopia.aingle.character.dto.CharacterInfo;
import com.aintopia.aingle.common.openai.model.OpenAIPrompt;
import com.aintopia.aingle.common.openai.model.PostRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.image.ImagePrompt;
import org.springframework.ai.image.ImageResponse;
import org.springframework.ai.model.Media;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.OpenAiImageModel;
import org.springframework.ai.openai.OpenAiImageOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Component;
import org.springframework.util.MimeTypeUtils;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenAIClient {

    private final OpenAiChatModel chatModel;
    private final OpenAiImageModel imageModel;
    private final List<Pair<String, String>> chatHistory = new ArrayList<>();


    //댓글 생성 함수
    public String createCommentByAI(PostRequest postRequest, CharacterInfo characterInfo) throws IOException {
        Prompt prompt = getPrompt(postRequest, characterInfo);
        ChatResponse chatResponse = chatModel.call(prompt);
        log.info("chat response : " + chatResponse);
        logTokensCount(chatResponse.getMetadata().getUsage());

        String response = chatResponse.getResult().getOutput().getContent();

        chatHistory.add(Pair.of(postRequest.getMessage(), response));
        log.info(chatHistory.toString());
        return response;
    }

    // 게시글 생성 함수
    public String createImage() throws MalformedURLException {
        String prompt = "당신은 25세 여자 대학생 유보은입니다. 유보은이 되어서 사용자와 대화를 진행합니다. 아래의 대화 패턴을 참고해서 질문에 대해 답변해주세요. \n" +
                "\n" +
                "###대화 패턴###\n" +
                "- 답변은 반말로 한다.\n" +
                "- 답변은 간결하게 한 문장으로 한다.\n" +
                "- 감정표현이 풍부하다.\n" +
                "- 이모티콘을 사용한다. 예시) \uD83D\uDE06\uD83D\uDE2D\n" +
                "- 성격은 단순활발하다.\n" +
                "- 맛집에 관심이 많다.\n" +
                "- “ㅋㅋㅋ”와 같은 웃음 표현을 자주 사용한다. 유보은이 sns에 작성할 이미지를 생성해줘.";

        ImageResponse imageResponse =  imageModel.call(
                new ImagePrompt(prompt,
                        OpenAiImageOptions.builder()
                                .withQuality("hd")
                                .withStyle("vivid")
                                .withHeight(1024)
                                .withWidth(1024).build())

        );
        String url = imageResponse.getResult().getOutput().getUrl();
        log.info("image URL : " + url);
        URL imageUrl = URI.create(url).toURL();

        Message userMessage = new UserMessage("이 사진의 시드 넘버를 알려줘.", new Media(MimeTypeUtils.IMAGE_PNG, imageUrl));
        ChatResponse chatResponse = chatModel.call(new Prompt(userMessage, OpenAiChatOptions.builder().withModel(OpenAiApi.ChatModel.GPT_4_O.getValue()).build()));
        return chatResponse.getResult().getOutput().getContent();
    }




    private Prompt getPrompt(PostRequest postRequest, CharacterInfo characterInfo) throws IOException {
        List<Message> promptMessages = new ArrayList<>();

        Message systemMessage = new SystemMessage(createCharacterSystemPrompt(characterInfo));
        promptMessages.add(systemMessage);

        chatHistory.forEach(pair -> {
            promptMessages.add(new UserMessage(pair.getLeft()));
            promptMessages.add(new AssistantMessage(pair.getRight()));
        });

        Message userMessage;
        URL imageUrl = URI.create(postRequest.getImageUrl()).toURL();
        String postText = OpenAIPrompt.AI_CHARACTER_COMMENT_REQUEST_PROMPT + postRequest.getMessage();
        userMessage = new UserMessage(postText, new Media(MimeTypeUtils.IMAGE_PNG, imageUrl));
        promptMessages.add(userMessage);
        log.info("promptMessages : " + promptMessages);
        return new Prompt(promptMessages, OpenAiChatOptions.builder().withModel(OpenAiApi.ChatModel.GPT_4_O.getValue()).build());
    }

    private String createCharacterSystemPrompt(CharacterInfo characterInfo){
        return OpenAIPrompt.AI_CHARACTER_SYSTEM_PROMPT.generateSystemPrompt(characterInfo);
    }

    private void logTokensCount(Usage usage) {
        log.debug("Tokens count Request {} Response {} Total {}", usage.getPromptTokens(),
                usage.getGenerationTokens(), usage.getTotalTokens());
    }
}
