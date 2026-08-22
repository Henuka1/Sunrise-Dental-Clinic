/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.config;

import com.sunrise.dental.resources.*;
import jakarta.ws.rs.core.Application;
import java.util.HashSet;
import java.util.Set;
/**
 *
 * @author User
 */
public class ApplicationConfig extends Application {
    
    @Override
    public Set<Class<?>> getClasses() {
        Set<Class<?>> classes = new HashSet<>();
        classes.add(AuthResource.class);
        classes.add(PatientResource.class);
        classes.add(AppointmentResource.class);
        classes.add(DentistResource.class);
        classes.add(TreatmentResource.class);
        classes.add(BillResource.class);
        classes.add(ReportResource.class);
        classes.add(UserResource.class);
        return classes;
    }
}