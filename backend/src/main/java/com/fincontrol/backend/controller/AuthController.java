package com.fincontrol.backend.controller;

import com.fincontrol.backend.dto.AuthDto;
import com.fincontrol.backend.model.Categoria;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.repository.CategoriaRepository;
import com.fincontrol.backend.repository.UserRepository;
import com.fincontrol.backend.security.JwtService;
import com.fincontrol.backend.security.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final CategoriaRepository categoriaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final AuthenticationManager authenticationManager;
    private final SecurityService securityService;

    @PostMapping("/register")
    public AuthDto.AuthResponse register(@RequestBody AuthDto.RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("E-mail já cadastrado");
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nome(request.getNome())
                .role("USER")
                .build();
        user = userRepository.save(user);

        seedDefaultCategorias(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        return AuthDto.AuthResponse.builder()
                .token(token)
                .nome(user.getNome())
                .email(user.getEmail())
                .build();
    }

    @PostMapping("/login")
    public AuthDto.AuthResponse login(@RequestBody AuthDto.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        return AuthDto.AuthResponse.builder()
                .token(token)
                .nome(user.getNome())
                .email(user.getEmail())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        User user = securityService.getAuthenticatedUser();
        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "nome", user.getNome(),
            "email", user.getEmail()
        ));
    }

    private void seedDefaultCategorias(User user) {
        List<Categoria> defaults = Arrays.asList(
            new Categoria(null, "Alimentação", "#EF4444", null, new ArrayList<>(), user),
            new Categoria(null, "Transporte", "#3B82F6", null, new ArrayList<>(), user),
            new Categoria(null, "Lazer", "#F59E0B", null, new ArrayList<>(), user),
            new Categoria(null, "Saúde", "#10B981", null, new ArrayList<>(), user),
            new Categoria(null, "Moradia", "#8B5CF6", null, new ArrayList<>(), user),
            new Categoria(null, "Outros", "#6B7280", null, new ArrayList<>(), user)
        );
        categoriaRepository.saveAll(defaults);
    }
}
