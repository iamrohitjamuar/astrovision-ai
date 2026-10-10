package com.astrovision.repository;

import java.util.List;
import com.astrovision.model.Reading;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReadingRepository extends MongoRepository<Reading, String> {
    List<Reading> findTop25ByOrderByCreatedAtDesc();
}
