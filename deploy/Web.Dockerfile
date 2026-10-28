FROM registry.cn-hangzhou.aliyuncs.com/sqdockler/simple_sq_music_plus_web@sha256:e1858465cb5ce80e91622f1702d97a9151d523ccd39dc0af1c9847ea2f0e3cd1
RUN rm -rf /usr/share/nginx/html/*
COPY dist/ /usr/share/nginx/html/
