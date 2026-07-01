package com.fincontrol.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fincontrol.backend.dto.AuthDto;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void testRegisterUser() throws Exception {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest("maria@email.com", "senha123", "Maria Silva");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.nome").value("Maria Silva"))
                .andExpect(jsonPath("$.email").value("maria@email.com"));

        assertTrue(userRepository.findByEmail("maria@email.com").isPresent());
    }

    @Test
    void testLoginUser() throws Exception {
        User user = User.builder()
                .nome("José Souza")
                .email("jose@email.com")
                .password(passwordEncoder.encode("senha456"))
                .role("USER")
                .build();
        userRepository.save(user);

        AuthDto.LoginRequest request = new AuthDto.LoginRequest("jose@email.com", "senha456");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.nome").value("José Souza"))
                .andExpect(jsonPath("$.email").value("jose@email.com"));
    }

    @Test
    void testProtectedRoutesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/dashboard/resumo"))
                .andExpect(status().isForbidden()); // Spring Security default response is 403 Forbidden for unauthorized requests when access is denied
    }
}
